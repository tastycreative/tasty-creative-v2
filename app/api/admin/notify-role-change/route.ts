import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    // Only admins can send role change notifications
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { userId, oldRole, newRole } = await request.json()

    if (!userId || !oldRole || !newRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Return notification data that the client can use to notify the user
    const notification = {
      userId,
      oldRole,
      newRole,
      timestamp: Date.now(),
    }

    return NextResponse.json({ 
      success: true, 
      notification 
    })
  } catch (error) {
    console.error("Error creating role change notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}