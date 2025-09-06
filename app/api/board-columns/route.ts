import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Fetch columns for a team
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    // Fetch columns for the team, ordered by position
    const columns = await prisma.boardColumn.findMany({
      where: {
        teamId,
        isActive: true,
      },
      orderBy: {
        position: 'asc'
      }
    });

    // If no columns exist, create default columns
    if (columns.length === 0) {
      const defaultColumns = [
        {
          id: `col_default_not_started_${Date.now()}`,
          teamId,
          label: 'Not Started',
          status: 'NOT_STARTED',
          position: 0,
          color: '#6B7280',
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
        {
          id: `col_default_in_progress_${Date.now() + 1}`,
          teamId,
          label: 'In Progress',
          status: 'IN_PROGRESS',
          position: 1,
          color: '#3B82F6',
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
        {
          id: `col_default_completed_${Date.now() + 2}`,
          teamId,
          label: 'Completed',
          status: 'COMPLETED',
          position: 2,
          color: '#10B981',
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
        {
          id: `col_default_cancelled_${Date.now() + 3}`,
          teamId,
          label: 'Cancelled',
          status: 'CANCELLED',
          position: 3,
          color: '#EF4444',
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
      ];

      const createdColumns = await prisma.boardColumn.createMany({
        data: defaultColumns,
        skipDuplicates: true,
      });

      // Fetch the newly created columns
      const newColumns = await prisma.boardColumn.findMany({
        where: {
          teamId,
          isActive: true,
        },
        orderBy: {
          position: 'asc'
        }
      });

      return NextResponse.json({ success: true, columns: newColumns });
    }

    return NextResponse.json({ success: true, columns });

  } catch (error) {
    console.error('Error fetching board columns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board columns' },
      { status: 500 }
    );
  }
}

// POST - Create a new column
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { teamId, label, status, position, color } = data;

    if (!teamId || !label || !status || position === undefined) {
      return NextResponse.json(
        { error: "Team ID, label, status, and position are required" },
        { status: 400 }
      );
    }

    // Check if position is already taken, if so, shift other columns
    const existingColumn = await prisma.boardColumn.findFirst({
      where: {
        teamId,
        position,
        isActive: true,
      }
    });

    if (existingColumn) {
      // Shift all columns at this position and after to the right
      await prisma.boardColumn.updateMany({
        where: {
          teamId,
          position: {
            gte: position
          },
          isActive: true,
        },
        data: {
          position: {
            increment: 1
          }
        }
      });
    }

    const newColumn = await prisma.boardColumn.create({
      data: {
        id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        teamId,
        label,
        status,
        position,
        color: color || '#6B7280',
        isDefault: false,
        isActive: true,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, column: newColumn });

  } catch (error) {
    console.error('Error creating board column:', error);
    return NextResponse.json(
      { error: 'Failed to create board column' },
      { status: 500 }
    );
  }
}

// PUT - Update a column
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json({ error: "Column ID is required" }, { status: 400 });
    }

    // If we're updating the status, we need to update all tasks that use the old status
    if (updates.status) {
      // Get the current column to find the old status
      const currentColumn = await prisma.boardColumn.findUnique({
        where: { id },
        select: { status: true, teamId: true }
      });

      if (currentColumn && currentColumn.status !== updates.status) {
        // Update all tasks that have the old status to use the new status
        await prisma.task.updateMany({
          where: {
            status: currentColumn.status,
            teamId: currentColumn.teamId,
          },
          data: {
            status: updates.status,
          },
        });
      }
    }

    const updatedColumn = await prisma.boardColumn.update({
      where: { id },
      data: updates
    });

    return NextResponse.json({ success: true, column: updatedColumn });

  } catch (error) {
    console.error('Error updating board column:', error);
    return NextResponse.json(
      { error: 'Failed to update board column' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a column
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Column ID is required" }, { status: 400 });
    }

    // Check if this is a default column
    const column = await prisma.boardColumn.findUnique({
      where: { id }
    });

    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    if (column.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default columns" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.boardColumn.update({
      where: { id },
      data: { isActive: false }
    });

    // Reorder remaining columns to fill the gap
    await prisma.boardColumn.updateMany({
      where: {
        teamId: column.teamId,
        position: {
          gt: column.position
        },
        isActive: true,
      },
      data: {
        position: {
          decrement: 1
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting board column:', error);
    return NextResponse.json(
      { error: 'Failed to delete board column' },
      { status: 500 }
    );
  }
}