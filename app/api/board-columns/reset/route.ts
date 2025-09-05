import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST - Reset to default columns
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { teamId } = data;

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    // Start a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete all existing columns for this team
      await tx.boardColumn.deleteMany({
        where: { teamId }
      });

      // Create default columns
      const defaultColumns = [
        {
          teamId,
          label: 'Not Started',
          status: 'NOT_STARTED',
          position: 0,
          color: '#6B7280',
          isDefault: true,
          isActive: true,
        },
        {
          teamId,
          label: 'In Progress',
          status: 'IN_PROGRESS',
          position: 1,
          color: '#3B82F6',
          isDefault: true,
          isActive: true,
        },
        {
          teamId,
          label: 'Completed',
          status: 'COMPLETED',
          position: 2,
          color: '#10B981',
          isDefault: true,
          isActive: true,
        },
        {
          teamId,
          label: 'Cancelled',
          status: 'CANCELLED',
          position: 3,
          color: '#EF4444',
          isDefault: true,
          isActive: true,
        },
      ];

      await tx.boardColumn.createMany({
        data: defaultColumns
      });

      // Fetch the newly created columns
      const newColumns = await tx.boardColumn.findMany({
        where: {
          teamId,
          isActive: true,
        },
        orderBy: {
          position: 'asc'
        }
      });

      return newColumns;
    });

    return NextResponse.json({ success: true, columns: result });

  } catch (error) {
    console.error('Error resetting board columns:', error);
    return NextResponse.json(
      { error: 'Failed to reset board columns' },
      { status: 500 }
    );
  }
}