import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendStrikeNotificationEmail } from "@/lib/email";

// GET /api/strikes - Fetch strikes for a team
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    // Fetch all strikes for the team
    const strikes = await prisma.strike.findMany({
      where: {
        podTeamId: teamId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        issuedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ strikes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching strikes:", error);
    return NextResponse.json(
      { error: "Failed to fetch strikes" },
      { status: 500 }
    );
  }
}

// POST /api/strikes - Add a new strike
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and moderators can add strikes
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true },
    });

    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR")) {
      return NextResponse.json(
        { error: "Only admins and moderators can add strikes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, podTeamId, reason, notes, attachments } = body;

    if (!userId || !podTeamId || !reason) {
      return NextResponse.json(
        { error: "User ID, Team ID, and reason are required" },
        { status: 400 }
      );
    }

    // Verify the user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the team exists
    const team = await prisma.podTeam.findUnique({
      where: { id: podTeamId },
      select: { id: true, name: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Create the strike
    const strike = await prisma.strike.create({
      data: {
        userId: userId,
        podTeamId: podTeamId,
        reason: reason,
        notes: notes || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        issuedById: currentUser.id,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        issuedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Count total active strikes for this user in this team
    const userStrikeCount = await prisma.strike.count({
      where: {
        userId: userId,
        podTeamId: podTeamId,
        isActive: true,
      },
    });

    // Send email notification to the user
    try {
      const teamUrl = `${process.env.NEXTAUTH_URL}/board?team=${podTeamId}`;
      
      await sendStrikeNotificationEmail({
        to: targetUser.email,
        userName: targetUser.name || "Team Member",
        reason: reason,
        issuedByName: currentUser.name || "Administrator",
        teamName: team.name,
        notes: notes || null,
        strikeCount: userStrikeCount,
        teamUrl: teamUrl,
      });
    } catch (emailError) {
      console.error("Error sending strike notification email:", emailError);
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json(
      {
        success: true,
        strike: strike,
        userStrikeCount: userStrikeCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding strike:", error);
    return NextResponse.json(
      { error: "Failed to add strike" },
      { status: 500 }
    );
  }
}

// PATCH /api/strikes - Deactivate/resolve a strike
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can deactivate strikes
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can deactivate strikes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { strikeId, isActive } = body;

    if (!strikeId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Strike ID and isActive status are required" },
        { status: 400 }
      );
    }

    // Update the strike
    const strike = await prisma.strike.update({
      where: { id: strikeId },
      data: {
        isActive: isActive,
        resolvedAt: isActive ? null : new Date(),
      },
    });

    return NextResponse.json({ success: true, strike }, { status: 200 });
  } catch (error) {
    console.error("Error updating strike:", error);
    return NextResponse.json(
      { error: "Failed to update strike" },
      { status: 500 }
    );
  }
}

// DELETE /api/strikes - Delete a strike (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete strikes
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can delete strikes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const strikeId = searchParams.get("strikeId");

    if (!strikeId) {
      return NextResponse.json(
        { error: "Strike ID is required" },
        { status: 400 }
      );
    }

    // Delete the strike
    await prisma.strike.delete({
      where: { id: strikeId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting strike:", error);
    return NextResponse.json(
      { error: "Failed to delete strike" },
      { status: 500 }
    );
  }
}
