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
    const columns = await (prisma as any).boardColumn.findMany({
      where: {
        teamId,
        isActive: true,
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

    // If no columns exist, create workflow-based default columns for new teams
    if (columns.length === 0) {
      const workflowColumns = [
        {
          id: `${teamId}-wall_post`,
          teamId,
          label: 'Wall Post Team',
          status: 'wall_post',
          position: 0,
          color: '#3B82F6',
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
        {
          id: `${teamId}-pg_team`,
          teamId,
          label: 'PG Team',
          status: 'pg_team',
          position: 1,
          color: '#8B5CF6',
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
        {
          id: `${teamId}-flyer_team`,
          teamId,
          label: 'Flyer Team',
          status: 'flyer_team',
          position: 2,
          color: '#EC4899',
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
        {
          id: `${teamId}-qa`,
          teamId,
          label: 'QA Team',
          status: 'qa',
          position: 3,
          color: '#F59E0B',
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
        {
          id: `${teamId}-deploy`,
          teamId,
          label: 'Deploy',
          status: 'deploy',
          position: 4,
          color: '#10B981',
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
      ];

      const createdColumns = await prisma.boardColumn.createMany({
        data: workflowColumns,
        skipDuplicates: true,
      });

      // Fetch the newly created columns
      const newColumns = await (prisma as any).boardColumn.findMany({
        where: {
          teamId,
          isActive: true,
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

    // Use transaction to ensure atomic position shifting and creation
    const newColumn = await prisma.$transaction(async (tx) => {
      // Get ALL columns for this team (including inactive ones), ordered by position
      const allColumns = await tx.boardColumn.findMany({
        where: {
          teamId,
        },
        orderBy: {
          position: 'asc'
        }
      });

      console.log(`Creating column at position ${position}. ALL columns (including inactive):`,
        allColumns.map(c => ({ id: c.id, pos: c.position, label: c.label, active: c.isActive })));

      // Check if position is already taken (INCLUDING inactive columns)
      const existingColumn = allColumns.find(col => col.position === position);

      if (existingColumn) {
        console.log(`Position ${position} is taken by ${existingColumn.isActive ? 'ACTIVE' : 'INACTIVE'} column. Shifting columns...`);

        // Get all columns at this position and after, in DESCENDING order
        const columnsToShift = allColumns
          .filter(col => col.position >= position)
          .sort((a, b) => b.position - a.position); // Highest first

        console.log('Columns to shift (including inactive):',
          columnsToShift.map(c => ({ id: c.id, pos: c.position, active: c.isActive })));

        // Shift each column individually from highest position to lowest
        for (const col of columnsToShift) {
          const newPos = col.position + 1;
          console.log(`Shifting column ${col.id} from position ${col.position} to ${newPos} (active: ${col.isActive})`);
          await tx.boardColumn.update({
            where: { id: col.id },
            data: { position: newPos }
          });
        }

        // Wait a moment to ensure updates are committed
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Verify the position is now free before creating (check ALL columns, not just active)
      const checkPosition = await tx.boardColumn.findFirst({
        where: {
          teamId,
          position,
        }
      });

      if (checkPosition) {
        console.error(`Position ${position} is STILL taken after shifting!`,
          { id: checkPosition.id, pos: checkPosition.position, active: checkPosition.isActive, label: checkPosition.label });
        throw new Error(`Position ${position} is still occupied after shifting. Column: ${checkPosition.id} (active: ${checkPosition.isActive})`);
      }

      console.log(`Position ${position} is now free. Creating new column...`);

      // Now create the new column at the desired position
      return await tx.boardColumn.create({
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
            podTeamId: currentColumn.teamId,
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

  // Find the column
  const column = await prisma.boardColumn.findUnique({
      where: { id }
    });

    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    // Find replacement column (nearest by position) to move tasks into
    const siblings = await prisma.boardColumn.findMany({
      where: {
        teamId: column.teamId,
        isActive: true,
        NOT: { id },
      },
      orderBy: { position: 'asc' }
    });

    if (siblings.length === 0) {
      return NextResponse.json(
        { error: 'Cannot delete the last remaining column. Create another column first or use reset.' },
        { status: 400 }
      );
    }

    // Pick nearest column by position (prefer previous, else next)
    const prev = siblings.filter(c => c.position < column.position).slice(-1)[0] || null;
    const next = siblings.find(c => c.position > column.position) || null;
    const replacement = prev || next || siblings[0];

    // Reassign tasks currently in this column to the replacement column status
    await prisma.task.updateMany({
      where: {
        status: column.status,
        podTeamId: column.teamId,
      },
      data: {
        status: replacement.status,
      },
    });

    // Get columns that need reordering (after the deleted column)
    const columnsToReorder = await prisma.boardColumn.findMany({
      where: {
        teamId: column.teamId,
        position: {
          gt: column.position
        },
        isActive: true,
      },
      orderBy: { position: 'asc' }
    });

    // Use transaction with two-phase update to avoid unique constraint violation
    await prisma.$transaction(async (tx) => {
      // Step 1: Soft delete by setting isActive to false
      await tx.boardColumn.update({
        where: { id },
        data: { isActive: false }
      });

      // Step 2: Move columns to temporary negative positions (no conflicts)
      for (let i = 0; i < columnsToReorder.length; i++) {
        await tx.boardColumn.update({
          where: { id: columnsToReorder[i].id },
          data: { position: -1000 - i } // Temporary negative position
        });
      }

      // Step 3: Move columns to their final positions (position - 1)
      for (let i = 0; i < columnsToReorder.length; i++) {
        await tx.boardColumn.update({
          where: { id: columnsToReorder[i].id },
          data: { position: columnsToReorder[i].position - 1 }
        });
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