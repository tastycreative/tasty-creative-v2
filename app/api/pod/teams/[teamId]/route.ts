import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// PUT - Update a specific team
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json({ error: "Admin or Moderator role required" }, { status: 403 });
    }

    const { teamId } = await params;
    const data = await request.json();

    // Find the team first
    const existingTeam = await prisma.podTeam.findUnique({
      where: { id: teamId }
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Handle name update
    if (data.name !== undefined) {
      if (!data.name?.trim()) {
        return NextResponse.json(
          { error: "Team name cannot be empty" },
          { status: 400 }
        );
      }

      // Check if name already exists (excluding current team)
      const existingNameTeam = await prisma.podTeam.findFirst({
        where: {
          name: data.name.trim(),
          isActive: true,
          id: { not: teamId }
        }
      });

      if (existingNameTeam) {
        return NextResponse.json(
          { error: "Team name already exists" },
          { status: 400 }
        );
      }

      updateData.name = data.name.trim();
    }

    // Handle project prefix update
    if (data.projectPrefix !== undefined) {
      if (!data.projectPrefix?.trim()) {
        return NextResponse.json(
          { error: "Project prefix cannot be empty" },
          { status: 400 }
        );
      }

      // Validate project prefix format (3-5 characters, alphanumeric)
      const prefix = data.projectPrefix.trim().toUpperCase();
      if (!/^[A-Z0-9]{3,5}$/.test(prefix)) {
        return NextResponse.json(
          { error: "Project prefix must be 3-5 alphanumeric characters" },
          { status: 400 }
        );
      }

      // Check if project prefix already exists (excluding current team)
      const existingPrefixTeam = await prisma.podTeam.findFirst({
        where: {
          projectPrefix: prefix,
          isActive: true,
          id: { not: teamId }
        }
      });

      if (existingPrefixTeam) {
        return NextResponse.json(
          { error: "Project prefix already exists" },
          { status: 400 }
        );
      }

      updateData.projectPrefix = prefix;
    }

    // Handle description update
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    // Handle column notifications toggle update
    if (data.columnNotificationsEnabled !== undefined) {
      updateData.columnNotificationsEnabled = Boolean(data.columnNotificationsEnabled);
    }

    // Handle notify all members toggle update
    if (data.notifyAllMembers !== undefined) {
      updateData.notifyAllMembers = Boolean(data.notifyAllMembers);
    }

    // Update the team
    const updatedTeam = await prisma.podTeam.update({
      where: { id: teamId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        assignedClients: true
      }
    });

    return NextResponse.json({
      success: true,
      team: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        description: updatedTeam.description,
        projectPrefix: updatedTeam.projectPrefix,
        columnNotificationsEnabled: updatedTeam.columnNotificationsEnabled,
        notifyAllMembers: updatedTeam.notifyAllMembers,
        isActive: updatedTeam.isActive,
        createdAt: updatedTeam.createdAt.toISOString(),
        updatedAt: updatedTeam.updatedAt.toISOString(),
        createdBy: updatedTeam.createdBy,
        memberCount: updatedTeam.members.length,
        clientCount: updatedTeam.assignedClients.length
      }
    });

  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// GET - Get a specific team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json({ error: "Admin or Moderator role required" }, { status: 403 });
    }

    const { teamId } = await params;

    const team = await prisma.podTeam.findUnique({
      where: { id: teamId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        assignedClients: {
          include: {
            clientModel: {
              select: {
                id: true,
                clientName: true,
                profilePicture: true,
                profileLink: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: team.id,
        name: team.name,
        description: team.description,
        projectPrefix: team.projectPrefix,
        columnNotificationsEnabled: team.columnNotificationsEnabled,
        notifyAllMembers: team.notifyAllMembers,
        isActive: team.isActive,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
        createdBy: team.createdBy,
        memberCount: team.members.length,
        clientCount: team.assignedClients.length,
        creators: team.assignedClients.map((assignment: any) => ({
          id: assignment.clientModel.id,
          name: assignment.clientModel.clientName,
          image: assignment.clientModel.profileLink || assignment.clientModel.profilePicture
        })),
        teamMembers: team.members.map((member: any) => ({
          id: member.id,
          userId: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
          role: member.role
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}
