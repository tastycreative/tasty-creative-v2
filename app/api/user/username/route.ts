import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { username } = await request.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters and contain only letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    // Check if username is already taken in Prisma database
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username,
        id: { not: session.user.id } // Exclude current user
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Step 1: Update username in Prisma database first
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { username: username },
      select: {
        id: true,
        username: true,
        email: true,
        name: true
      }
    });

    // Step 2: Create or update forum user in backend
    try {
      const forumUserResponse = await fetch(`http://localhost:3000/forum/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: updatedUser.username,
          email: updatedUser.email,
          avatar: username.substring(0, 2).toUpperCase(),
          externalId: session.user.id, // Link to Prisma user
        }),
      });

      if (!forumUserResponse.ok) {
        const errorText = await forumUserResponse.text();
        console.error('Failed to create forum user:', errorText);
        // Don't return error here since Prisma was updated successfully
        // The forum user will be created later when needed
      }

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          name: updatedUser.name,
          hasUsername: true,
        }
      });

    } catch (forumError) {
      console.error('Error creating forum user:', forumError);
      // Still return success since Prisma was updated
      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          name: updatedUser.name,
          hasUsername: true,
        }
      });
    }

  } catch (error) {
    console.error("Error updating username:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      console.log("No session or user ID found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Getting user for ID:", session.user.id);

    // Get user data from Prisma database (primary source of truth)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      console.log("User not found in database for ID:", session.user.id);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("User found:", { id: user.id, username: user.username, hasUsername: Boolean(user.username) });

    return NextResponse.json({ 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        hasUsername: Boolean(user.username),
      }
    });

  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
