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

      // Create workflow-based default columns
      const defaultColumns = [
        {
          teamId,
          label: 'Wall Post Team',
          status: 'wall_post',
          position: 0,
          color: '#3B82F6',
          isDefault: true,
          isActive: true,
        },
        {
          teamId,
          label: 'PG Team',
          status: 'pg_team',
          position: 1,
          color: '#8B5CF6',
          isDefault: true,
          isActive: true,
        },
        {
          teamId,
          label: 'Flyer Team',
          status: 'flyer_team',
          position: 2,
          color: '#EC4899',
          isDefault: true,
          isActive: true,
        },
        {
          teamId,
          label: 'QA Team',
          status: 'qa',
          position: 3,
          color: '#F59E0B',
          isDefault: true,
          isActive: true,
        },
        {
          teamId,
          label: 'Deploy',
          status: 'deploy',
          position: 4,
          color: '#10B981',
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