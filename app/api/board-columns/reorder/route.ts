import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST - Reorder columns
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { teamId, columnIds } = data;

    if (!teamId || !Array.isArray(columnIds)) {
      return NextResponse.json(
        { error: "Team ID and column IDs array are required" },
        { status: 400 }
      );
    }

    // Validate that all columnIds exist and belong to this team
    const existingColumns = await prisma.boardColumn.findMany({
      where: { 
        teamId,
        isActive: true,
        id: { in: columnIds }
      },
      select: { id: true }
    });

    if (existingColumns.length !== columnIds.length) {
      return NextResponse.json(
        { error: "Some column IDs are invalid or don't belong to this team" },
        { status: 400 }
      );
    }

    // Use transaction with timeout to avoid unique constraint violations
    const updatedColumns = await prisma.$transaction(async (tx) => {
      // Step 1: Set all columns to temporary negative positions to avoid conflicts
      const tempUpdates = columnIds.map((id, index) => 
        tx.boardColumn.update({
          where: { 
            id,
            teamId, // Security check
          },
          data: { position: -(index + 1000) } // Use large negative numbers to avoid conflicts
        })
      );
      await Promise.all(tempUpdates);

      // Step 2: Set columns to their final positions
      const finalUpdates = columnIds.map((id, index) => 
        tx.boardColumn.update({
          where: { 
            id,
            teamId, // Security check
          },
          data: { position: index }
        })
      );
      await Promise.all(finalUpdates);

      // Fetch updated columns
      return await tx.boardColumn.findMany({
        where: {
          teamId,
          isActive: true,
        },
        orderBy: {
          position: 'asc'
        }
      });
    }, {
      timeout: 10000, // 10 second timeout
    });

    return NextResponse.json({ success: true, columns: updatedColumns });

  } catch (error) {
    console.error('Error reordering board columns:', error);
    return NextResponse.json(
      { error: 'Failed to reorder board columns' },
      { status: 500 }
    );
  }
}