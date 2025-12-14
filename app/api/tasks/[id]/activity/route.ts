import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

interface ActivityHistoryParams {
  params: {
    id: string;
  };
}

// GET - Fetch activity history for a specific task
export async function GET(request: NextRequest, { params }: ActivityHistoryParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Verify the task exists and user has access to it
    const task = await (prisma as any).task.findUnique({
      where: { id: taskId },
      select: { id: true, podTeamId: true }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch activity history with user information
    const activities = await (prisma as any).taskActivityHistory.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Oldest first, so timeline flows left to right (old -> new)
      }
    });

    return NextResponse.json({ success: true, activities });

  } catch (error) {
    console.error('Error fetching task activity history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task activity history' },
      { status: 500 }
    );
  }
}

// POST - Create a new activity history entry
export async function POST(request: NextRequest, { params }: ActivityHistoryParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const data = await request.json();
    const { actionType, fieldName, oldValue, newValue, description } = data;

    if (!taskId || !actionType) {
      return NextResponse.json(
        { error: "Task ID and action type are required" },
        { status: 400 }
      );
    }

    // Verify the task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Helper function to properly serialize values
    const serializeValue = (value: any): string | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'string') return value; // Don't JSON.stringify simple strings
      return JSON.stringify(value); // Only stringify complex objects
    };

    // Create activity history entry
    const activity = await (prisma as any).taskActivityHistory.create({
      data: {
        taskId,
        userId: session.user.id,
        actionType,
        fieldName,
        oldValue: serializeValue(oldValue),
        newValue: serializeValue(newValue),
        description
      },
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
    });

    return NextResponse.json({ success: true, activity });

  } catch (error) {
    console.error('Error creating task activity history:', error);
    return NextResponse.json(
      { error: 'Failed to create task activity history' },
      { status: 500 }
    );
  }
}