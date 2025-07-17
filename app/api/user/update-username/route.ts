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

    // Update the user's username in Prisma database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
      select: { id: true, username: true, email: true, name: true }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating username in Prisma:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
