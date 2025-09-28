import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

// Helper function to delete file from S3
async function deleteFromS3(s3Key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
}

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
    const { content, attachments } = data;

    // Allow update if there's either content or attachments
    const hasContent = content?.trim()?.length > 0;
    const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0;

    if (!taskId || !commentId || (!hasContent && !hasAttachments)) {
      return NextResponse.json(
        { error: "Task ID, comment ID, and either content or attachments are required" },
        { status: 400 }
      );
    }

    // Verify the comment exists and user is the author
    const existingComment = await (prisma as any).taskComment.findUnique({
      where: { id: commentId },
      select: { 
        id: true, 
        taskId: true, 
        userId: true,
        attachments: true
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

    // Identify attachments to delete from S3
    const currentAttachments = existingComment.attachments as any[] || [];
    const newAttachmentIds = new Set((attachments || []).map((att: any) => att.id));
    const attachmentsToDelete = currentAttachments.filter((att: any) => !newAttachmentIds.has(att.id));

    // Delete removed attachments from S3 (process in parallel, don't fail on errors)
    if (attachmentsToDelete.length > 0) {
      const deletePromises = attachmentsToDelete.map(async (attachment: any) => {
        try {
          if (attachment.s3Key) {
            await deleteFromS3(attachment.s3Key);
          }
        } catch (error) {
          console.error('Failed to delete S3 file:', error);
          // Don't fail the comment update if S3 deletion fails
        }
      });
      
      // Process deletions in parallel but don't wait for completion
      Promise.allSettled(deletePromises);
    }

    // Update comment
    const comment = await (prisma as any).taskComment.update({
      where: { id: commentId },
      data: {
        content: content?.trim() || '', // Use empty string if no content
        attachments: attachments && attachments.length > 0 ? attachments : null
        // updatedAt is automatically handled by @updatedAt decorator
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
    const existingComment = await (prisma as any).taskComment.findUnique({
      where: { id: commentId },
      select: { 
        id: true, 
        taskId: true, 
        userId: true,
        attachments: true
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

    // Delete all attachments from S3 before deleting the comment
    const attachments = existingComment.attachments as any[] || [];
    if (attachments.length > 0) {
      const deletePromises = attachments.map(async (attachment: any) => {
        try {
          if (attachment.s3Key) {
            await deleteFromS3(attachment.s3Key);
          }
        } catch (error) {
          console.error('Failed to delete S3 file:', error);
          // Don't fail the comment deletion if S3 deletion fails
        }
      });
      
      // Process deletions in parallel but don't wait for completion
      Promise.allSettled(deletePromises);
    }

    // Delete comment
    await (prisma as any).taskComment.delete({
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