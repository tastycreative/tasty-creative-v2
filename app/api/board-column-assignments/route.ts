import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch column member assignments for a team
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Verify user has access to this team
    const teamMember = await (prisma as any).podTeamMember.findFirst({
      where: {
        teamId: teamId,
        userId: session.user.id
      }
    });

    if (!teamMember && session.user.role !== 'POD') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch columns with their assigned members
    const columns = await (prisma as any).boardColumn.findMany({
      where: {
        teamId: teamId,
        isActive: true
      },
      include: {
        assignedMembers: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            },
            assignedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    });

    return NextResponse.json({ columns });

  } catch (error) {
    console.error('Error fetching column assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch column assignments' },
      { status: 500 }
    );
  }
}

// POST - Assign member to column
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { columnId, userId, teamId } = body;

    if (!columnId || !userId || !teamId) {
      return NextResponse.json(
        { error: 'Column ID, User ID, and Team ID are required' },
        { status: 400 }
      );
    }

    // Verify user has admin access to this team
    const teamMember = await (prisma as any).podTeamMember.findFirst({
      where: {
        teamId: teamId,
        userId: session.user.id,
        role: { in: ['ADMIN', 'MANAGER'] }
      }
    });

    if (!teamMember && session.user.role !== 'POD') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Verify the user being assigned is a member of the team
    const targetTeamMember = await (prisma as any).podTeamMember.findFirst({
      where: {
        teamId: teamId,
        userId: userId
      }
    });

    if (!targetTeamMember) {
      return NextResponse.json(
        { error: 'User is not a member of this team' },
        { status: 400 }
      );
    }

    // Verify the column belongs to the team
    const column = await (prisma as any).boardColumn.findFirst({
      where: {
        id: columnId,
        teamId: teamId
      }
    });

    if (!column) {
      return NextResponse.json(
        { error: 'Column not found or does not belong to this team' },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await (prisma as any).boardColumnMemberAssignment.findFirst({
      where: {
        columnId: columnId,
        userId: userId,
        isActive: true
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'User is already assigned to this column' },
        { status: 409 }
      );
    }

    // Create the assignment
    const assignment = await (prisma as any).boardColumnMemberAssignment.create({
      data: {
        columnId: columnId,
        userId: userId,
        assignedById: session.user.id,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ assignment });

  } catch (error) {
    console.error('Error assigning member to column:', error);
    return NextResponse.json(
      { error: 'Failed to assign member to column' },
      { status: 500 }
    );
  }
}

// DELETE - Remove member from column
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const teamId = searchParams.get('teamId');

    if (!assignmentId || !teamId) {
      return NextResponse.json(
        { error: 'Assignment ID and Team ID are required' },
        { status: 400 }
      );
    }

    // Verify user has admin access to this team
    const teamMember = await (prisma as any).podTeamMember.findFirst({
      where: {
        teamId: teamId,
        userId: session.user.id,
        role: { in: ['ADMIN', 'MANAGER'] }
      }
    });

    if (!teamMember && session.user.role !== 'POD') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Verify the assignment exists and belongs to the team
    const assignment = await (prisma as any).boardColumnMemberAssignment.findFirst({
      where: {
        id: assignmentId,
        isActive: true
      },
      include: {
        column: {
          select: {
            teamId: true
          }
        }
      }
    });

    if (!assignment || assignment.column.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      );
    }

    // Soft delete the assignment
    await (prisma as any).boardColumnMemberAssignment.update({
      where: {
        id: assignmentId
      },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error removing member from column:', error);
    return NextResponse.json(
      { error: 'Failed to remove member from column' },
      { status: 500 }
    );
  }
}
