import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Fetch all teams (alias for teams-db)
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
                row_id: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Transform the data
    const teams = podTeams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      isActive: team.isActive,
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
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST - Create a new team
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const data = await request.json();
    const { name, description } = data;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Check if team name already exists
    const existingTeam = await prisma.podTeam.findFirst({
      where: {
        name: name.trim(),
        isActive: true
      }
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "Team name already exists" },
        { status: 400 }
      );
    }

    // Try to find user in database, but don't fail if not found
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true }
    });

    if (existingUser) {
      console.log('Creating team with user:', { userId: existingUser.id, userEmail: existingUser.email });
    } else {
      console.log('Creating team without user reference (user not in database):', { sessionUserId: session.user.id, sessionUserEmail: session.user.email });
    }

    // Create new team (with or without createdBy depending on user existence)
    const team = await prisma.podTeam.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdById: existingUser?.id || null
      },
      include: {
        createdBy: existingUser ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : undefined
      }
    });

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        isActive: team.isActive,
        createdAt: team.createdAt.toISOString(),
        createdBy: team.createdBy || null,
        memberCount: 0,
        clientCount: 0
      }
    });

  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
