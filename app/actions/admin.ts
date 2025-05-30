"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import { revalidatePath } from "next/cache"

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

    // Revalidate the admin users page to show updated data
    revalidatePath("/admin/users")

    return { success: true, user: updatedUser }
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