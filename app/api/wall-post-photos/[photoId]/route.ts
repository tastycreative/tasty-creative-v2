import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createTaskActivity } from '@/lib/taskActivityHelper';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

// PATCH - Update wall post photo (caption, status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { photoId } = await params;
    const body = await request.json();
    const { caption, status } = body;

    // Get photo with submission and task info
    const photo = await prisma.wallPostPhoto.findUnique({
      where: { id: photoId },
      include: {
        wallPostSubmission: {
          include: {
            task: {
              include: {
                podTeam: true,
              },
            },
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Check user access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      const teamMember = await prisma.podTeamMember.findUnique({
        where: {
          podTeamId_userId: {
            podTeamId: photo.wallPostSubmission.task.podTeamId!,
            userId: session.user.id!,
          },
        },
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: 'User does not have access to this team' },
          { status: 403 }
        );
      }
    }

    // Build update data
    const updateData: any = {};

    if (caption !== undefined) {
      updateData.caption = caption;
    }

    if (status !== undefined) {
      updateData.status = status;

      // Set postedAt timestamp when status changes to POSTED
      if (status === 'POSTED' && photo.status !== 'POSTED') {
        updateData.postedAt = new Date();
      }

      // TODO: When status is POSTED, publish caption to Gallery
      // This will be implemented in Phase 2
    }

    // Update the photo
    const updatedPhoto = await prisma.wallPostPhoto.update({
      where: { id: photoId },
      data: updateData,
    });

    // Track activity for caption changes
    if (caption !== undefined && photo.caption !== caption) {
      const userName = session.user.name || session.user.email || 'Unknown User';
      const taskId = photo.wallPostSubmission.task.id;
      const photoPosition = photo.position + 1; // 1-indexed for display

      const description = caption
        ? photo.caption
          ? `${userName} updated caption for photo #${photoPosition}`
          : `${userName} added caption to photo #${photoPosition}`
        : `${userName} removed caption from photo #${photoPosition}`;

      await createTaskActivity({
        taskId,
        userId: session.user.id!,
        actionType: 'UPDATED',
        fieldName: `photo_${photoId}_caption`,
        oldValue: photo.caption,
        newValue: caption,
        description,
        metadata: {
          photoId,
          photoPosition,
          activityType: 'photo_caption',
          changeType: caption ? (photo.caption ? 'updated' : 'added') : 'removed'
        }
      });
    }

    // Track activity for status changes
    if (status !== undefined && photo.status !== status) {
      const userName = session.user.name || session.user.email || 'Unknown User';
      const taskId = photo.wallPostSubmission.task.id;
      const photoPosition = photo.position + 1;

      const statusLabels: Record<string, string> = {
        PENDING_REVIEW: 'Pending Review',
        READY_TO_POST: 'Ready to Post',
        POSTED: 'Posted',
        REJECTED: 'Rejected',
      };

      const oldStatusLabel = statusLabels[photo.status] || photo.status;
      const newStatusLabel = statusLabels[status] || status;

      await createTaskActivity({
        taskId,
        userId: session.user.id!,
        actionType: 'STATUS_CHANGED',
        fieldName: `photo_${photoId}_status`,
        oldValue: photo.status,
        newValue: status,
        description: `${userName} changed photo #${photoPosition} status from "${oldStatusLabel}" to "${newStatusLabel}"`,
        metadata: {
          photoId,
          photoPosition,
          activityType: 'photo_status',
          oldStatusLabel,
          newStatusLabel
        }
      });
    }

    return NextResponse.json({
      success: true,
      photo: updatedPhoto,
    });

  } catch (error) {
    console.error('Error updating wall post photo:', error);
    return NextResponse.json(
      { error: 'Failed to update wall post photo' },
      { status: 500 }
    );
  }
}

// DELETE - Delete wall post photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { photoId } = await params;

    // Get photo with submission and task info
    const photo = await prisma.wallPostPhoto.findUnique({
      where: { id: photoId },
      include: {
        wallPostSubmission: {
          include: {
            task: {
              include: {
                podTeam: true,
              },
            },
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Check user access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      const teamMember = await prisma.podTeamMember.findUnique({
        where: {
          podTeamId_userId: {
            podTeamId: photo.wallPostSubmission.task.podTeamId!,
            userId: session.user.id!,
          },
        },
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: 'User does not have access to this team' },
          { status: 403 }
        );
      }
    }

    // Delete from S3
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: photo.s3Key,
      });
      await s3Client.send(deleteCommand);
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await prisma.wallPostPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting wall post photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete wall post photo' },
      { status: 500 }
    );
  }
}
