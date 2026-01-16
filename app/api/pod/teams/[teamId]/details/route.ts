import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET - Get detailed team information including creators
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
                clientName: true
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
          name: assignment.clientModel.clientName
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
    console.error('Error fetching team details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team details' },
      { status: 500 }
    );
  }
}