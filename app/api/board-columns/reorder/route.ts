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

    // Use transaction to avoid unique constraint violations
    const updatedColumns = await prisma.$transaction(async (tx) => {
      // First, get all columns for this team
      const existingColumns = await tx.boardColumn.findMany({
        where: { teamId },
        orderBy: { position: 'asc' }
      });

      // Set each column to a unique negative position temporarily
      for (let i = 0; i < existingColumns.length; i++) {
        await tx.boardColumn.update({
          where: { id: existingColumns[i].id },
          data: { position: -(i + 1000) } // Use large negative numbers to avoid conflicts
        });
      }

      // Then update positions according to the new order
      for (let i = 0; i < columnIds.length; i++) {
        await tx.boardColumn.update({
          where: { 
            id: columnIds[i],
            teamId,
          },
          data: { position: i }
        });
      }

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