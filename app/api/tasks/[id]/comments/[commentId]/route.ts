import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

interface CommentParams {
  params: {
    id: string;
    commentId: string;
  };
}

// PUT - Update a comment (only by the author)
export async function PUT(request: NextRequest, { params }: CommentParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: taskId, commentId } = await params;
    const data = await request.json();
    const { content } = data;

    if (!taskId || !commentId || !content?.trim()) {
      return NextResponse.json(
        { error: "Task ID, comment ID, and content are required" },
        { status: 400 }
      );
    }

    // Verify the comment exists and user is the author
    const existingComment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      select: { 
        id: true, 
        taskId: true, 
        userId: true 
      }
    });

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (existingComment.taskId !== taskId) {
      return NextResponse.json({ error: "Comment does not belong to this task" }, { status: 400 });
    }

    if (existingComment.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only edit your own comments" }, { status: 403 });
    }

    // Update comment
    const comment = await prisma.taskComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        updatedAt: new Date()
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
    console.error('Error updating task comment:', error);
    return NextResponse.json(
      { error: 'Failed to update task comment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment (only by the author)
export async function DELETE(request: NextRequest, { params }: CommentParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: taskId, commentId } = await params;

    if (!taskId || !commentId) {
      return NextResponse.json(
        { error: "Task ID and comment ID are required" },
        { status: 400 }
      );
    }

    // Verify the comment exists and user is the author
    const existingComment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      select: { 
        id: true, 
        taskId: true, 
        userId: true 
      }
    });

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (existingComment.taskId !== taskId) {
      return NextResponse.json({ error: "Comment does not belong to this task" }, { status: 400 });
    }

    if (existingComment.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only delete your own comments" }, { status: 403 });
    }

    // Delete comment
    await prisma.taskComment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting task comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete task comment' },
      { status: 500 }
    );
  }
}