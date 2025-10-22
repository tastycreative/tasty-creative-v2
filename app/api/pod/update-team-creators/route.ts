import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json({ error: "Admin or Moderator role required" }, { status: 403 });
    }

    const { teamId, creators } = await request.json();
    const creatorNames = creators || [];

    if (!teamId || !Array.isArray(creatorNames)) {
      return NextResponse.json(
        { error: 'Team ID and creator names array are required' },
        { status: 400 }
      );
    }

    // Verify team exists
    const team = await prisma.podTeam.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // First, remove all existing creator assignments for this team
    await prisma.podTeamClientAssignment.deleteMany({
      where: { podTeamId: teamId }
    });

    console.log(`Removed existing creator assignments for team ${teamId}`);

    // If no creators provided, we're done
    if (creatorNames.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All creators removed from team',
        assignments: []
      });
    }

    // Find ClientModels by name
    const clientModels = await prisma.clientModel.findMany({
      where: {
        clientName: {
          in: creatorNames
        }
      }
    });

    if (clientModels.length === 0) {
      return NextResponse.json(
        { error: 'No matching creators found' },
        { status: 404 }
      );
    }

    // Create new assignments for the selected creators
    const assignments = await Promise.all(
      clientModels.map(async (client) => {
        return prisma.podTeamClientAssignment.create({
          data: {
            podTeamId: teamId,
            clientModelId: client.id,
            assignedById: session.user!.id,
            isActive: true,
            notes: 'Updated via admin dashboard'
          },
          include: {
            clientModel: {
              select: {
                id: true,
                clientName: true
              }
            }
          }
        });
      })
    );

    console.log(`Updated team ${teamId} with ${assignments.length} creator assignments`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated team with ${assignments.length} creators`,
      assignments: assignments.map(a => ({
        creatorId: a.clientModel.id,
        creatorName: a.clientModel.clientName
      }))
    });

  } catch (error) {
    console.error('Error updating team creators:', error);
    return NextResponse.json(
      { error: 'Failed to update team creators' },
      { status: 500 }
    );
  }
}