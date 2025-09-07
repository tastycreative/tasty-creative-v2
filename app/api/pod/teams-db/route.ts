import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch all pod teams from database with new schema
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
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Transform the data to match the new format
    const teams = podTeams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      isActive: team.isActive,
      createdAt: team.createdAt.toISOString(),
      createdBy: team.createdBy
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