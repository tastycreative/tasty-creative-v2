import { NextResponse } from "next/server"
import { auth, signIn } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get the absolutely fresh user data from database
    const freshUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
      },
    })

    if (!freshUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if the role has actually changed
    if (session.user.role !== freshUser.role) {
      console.log(`Force refresh: Role changed from ${session.user.role} to ${freshUser.role} for user ${freshUser.id}`)
      
      // Return the fresh user data and indicate a forced sign-in is needed
      return NextResponse.json({
        success: true,
        roleChanged: true,
        user: {
          id: freshUser.id,
          email: freshUser.email,
          name: freshUser.name,
          image: freshUser.image,
          role: freshUser.role,
          emailVerified: freshUser.emailVerified,
        },
        // Include a timestamp to force new token generation
        forceRefreshAt: Date.now()
      })
    }

    return NextResponse.json({
      success: true,
      roleChanged: false,
      user: {
        id: freshUser.id,
        email: freshUser.email,
        name: freshUser.name,
        image: freshUser.image,
        role: freshUser.role,
        emailVerified: freshUser.emailVerified,
      }
    })
  } catch (error) {
    console.error("Error in force refresh:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}