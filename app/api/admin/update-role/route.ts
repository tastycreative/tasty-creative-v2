import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Role } from "@prisma/client"
import { sendRoleElevationEmail } from "@/lib/email"

export async function POST(req: Request) {
  const session = await auth()
  
  // Check if user is admin
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const { userId, role } = await req.json()
    
    // Validate role
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

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
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if this is an elevation from GUEST to any other role
    const isElevation = currentUser.role === "GUEST" && role !== "GUEST"

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    // Send email notification for role elevation (from GUEST to any other role)
    if (isElevation && currentUser.email && currentUser.name) {
      try {
        await sendRoleElevationEmail({
          to: currentUser.email,
          userName: currentUser.name,
          oldRole: currentUser.role,
          newRole: role,
        })
        console.log(`Role elevation email sent to ${currentUser.email} for role change from ${currentUser.role} to ${role}`)
      } catch (emailError) {
        console.error("Failed to send role elevation email:", emailError)
        // Don't fail the role update if email sending fails
      }
    }

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}