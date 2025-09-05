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

    // Use transaction to avoid unique constraint violations
    const updatedColumns = await prisma.$transaction(async (tx) => {
      // Step 1: Set all columns to temporary negative positions to avoid conflicts
      for (let i = 0; i < columnIds.length; i++) {
        await tx.BoardColumn.update({
          where: { 
            id: columnIds[i],
            teamId, // Security check
          },
          data: { position: -(i + 1000) } // Use large negative numbers to avoid conflicts
        });
      }

      // Step 2: Set columns to their final positions
      for (let i = 0; i < columnIds.length; i++) {
        await tx.BoardColumn.update({
          where: { 
            id: columnIds[i],
            teamId, // Security check
          },
          data: { position: i }
        });
      }

      // Fetch updated columns
      return await tx.BoardColumn.findMany({
        where: {
          teamId,
          isActive: true,
        },
        orderBy: {
          position: 'asc'
        }
      });
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