import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Role } from "@prisma/client"

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

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}