"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { sendRoleElevationEmail } from "@/lib/email"

export async function updateUserRole(userId: string, newRole: Role) {
  // Check if the current user is an admin
  const session = await auth()
  
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can update user roles")
  }

  // Prevent admins from changing their own role
  if (session.user.id === userId) {
    throw new Error("You cannot change your own role")
  }

  // Validate the role
  if (!Object.values(Role).includes(newRole)) {
    throw new Error("Invalid role")
  }

  try {
    // Get current user data before update
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (!currentUser) {
      throw new Error("User not found")
    }

    // Check if this is an elevation from GUEST to any other role
    const isElevation = currentUser.role === "GUEST" && newRole !== "GUEST"

    // Update the user's role in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    })

    // Log the role change in activity history
    try {
      await prisma.userActivityHistory.create({
        data: {
          actorId: session.user.id,
          targetUserId: userId,
          actionType: 'ROLE_CHANGED',
          oldRole: currentUser.role,
          newRole: newRole,
          reason: isElevation ? 'Role elevation from guest access' : 'Role changed by admin'
        }
      })
    } catch (activityError) {
      console.error('Failed to log user activity:', activityError)
      // Don't fail the role update if activity logging fails
    }

    // Send email notification for role elevation (from GUEST to any other role)
    if (isElevation && currentUser.email && currentUser.name) {
      try {
        await sendRoleElevationEmail({
          to: currentUser.email,
          userName: currentUser.name,
          oldRole: currentUser.role,
          newRole: newRole,
        })
        console.log(`Role elevation email sent to ${currentUser.email} for role change from ${currentUser.role} to ${newRole}`)
      } catch (emailError) {
        console.error("Failed to send role elevation email:", emailError)
        // Don't fail the role update if email sending fails
      }
    }

    // Revalidate the admin users page to show updated data
    revalidatePath("/admin/users")

    return { 
      success: true, 
      user: updatedUser,
      roleChangeNotification: {
        userId: currentUser.id,
        oldRole: currentUser.role,
        newRole: newRole,
        timestamp: Date.now()
      }
    }
  } catch (error) {
    console.error("Failed to update user role:", error)
    throw new Error("Failed to update user role")
  }
}

// Optional: Get user statistics
export async function getUserStats() {
  const session = await auth()
  
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const [totalUsers, adminCount, moderatorCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "MODERATOR" } }),
  ])

  return {
    totalUsers,
    adminCount,
    moderatorCount,
    userCount: totalUsers - adminCount - moderatorCount,
  }
}