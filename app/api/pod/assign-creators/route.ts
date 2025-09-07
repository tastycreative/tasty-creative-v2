import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const { teamId, creatorNames } = await request.json();

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

    // Create assignments for each found creator
    const assignments = await Promise.all(
      clientModels.map(async (client) => {
        return prisma.podTeamClientAssignment.create({
          data: {
            podTeamId: teamId,
            clientModelId: client.id,
            assignedById: session.user!.id,
            isActive: true,
            notes: 'Assigned via admin dashboard'
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

    console.log(`Assigned ${assignments.length} creators to team ${teamId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${assignments.length} creators to team`,
      assignments: assignments.map(a => ({
        creatorId: a.clientModel.id,
        creatorName: a.clientModel.clientName
      }))
    });

  } catch (error) {
    console.error('Error assigning creators to team:', error);
    return NextResponse.json(
      { error: 'Failed to assign creators to team' },
      { status: 500 }
    );
  }
}