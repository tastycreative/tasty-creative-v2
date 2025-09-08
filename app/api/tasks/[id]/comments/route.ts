import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

interface CommentsParams {
  params: {
    id: string;
  };
}

// GET - Fetch comments for a specific task
export async function GET(request: NextRequest, { params }: CommentsParams) {
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
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, podTeamId: true }
    } as any);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch comments with user information and attachments
    const comments = await (prisma as any).taskComment.findMany({
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
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ success: true, comments });

  } catch (error) {
    console.error('Error fetching task comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task comments' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest, { params }: CommentsParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const data = await request.json();
    const { content, attachments } = data;

    if (!taskId || !content?.trim()) {
      return NextResponse.json(
        { error: "Task ID and content are required" },
        { status: 400 }
      );
    }

    // Verify the task exists
    const task = await (prisma as any).task.findUnique({
      where: { id: taskId },
      select: { id: true, podTeamId: true }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Create comment
    const comment = await (prisma as any).taskComment.create({
      data: {
        taskId,
        userId: session.user.id,
        content: content.trim(),
        attachments: attachments && attachments.length > 0 ? attachments : null
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

    return NextResponse.json({ success: true, comment });

  } catch (error) {
    console.error('Error creating task comment:', error);
    return NextResponse.json(
      { error: 'Failed to create task comment' },
      { status: 500 }
    );
  }
}