import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Fetch all teams from database (alias for /api/pod/teams)
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch all pod teams from database
    const podTeams = await prisma.podTeam.findMany({
      where: {
        isActive: true
      },
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
            clientModel: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Transform the data to match expected format
    const teams = podTeams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      isActive: team.isActive,
      order: team.order,
      createdAt: team.createdAt.toISOString(),
      createdBy: team.createdBy,
      memberCount: team.members.length,
      clientCount: team.assignedClients.length,
      members: team.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
        role: member.role
      }))
    }));

    return NextResponse.json({
      success: true,
      teams: teams
    });

  } catch (error) {
    console.error('Error fetching teams from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams from database' },
      { status: 500 }
    );
  }
}