import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, modelName, driveLink, uploadedPhotos, columnStatus } = body;

    console.log('Wall Post Bulk API - Received data:', {
      teamId,
      modelName,
      driveLink,
      hasUploadedPhotos: !!uploadedPhotos,
      uploadedPhotosCount: uploadedPhotos?.length || 0,
      columnStatus
    });

    // Require either driveLink OR uploadedPhotos
    if (!teamId || !modelName) {
      console.error('Wall Post Bulk API - Missing required fields:', {
        hasTeamId: !!teamId,
        hasModelName: !!modelName,
      });
      return NextResponse.json(
        { error: 'Missing required fields: teamId and modelName are required' },
        { status: 400 }
      );
    }

    if (!driveLink && (!uploadedPhotos || uploadedPhotos.length === 0)) {
      return NextResponse.json(
        { error: 'Either driveLink or uploadedPhotos is required' },
        { status: 400 }
      );
    }

    // If no column status provided, get the first column for this team
    let taskStatus = columnStatus;

    if (!taskStatus) {
      const firstColumn = await (prisma as any).boardColumn.findFirst({
        where: {
          teamId,
          isActive: true,
        },
        orderBy: {
          position: 'asc',
        },
      });

      taskStatus = firstColumn?.status || 'wall_post'; // Fallback to 'wall_post' if no columns exist
      console.log('Wall Post Bulk API - Using status from first column:', taskStatus);
    }

    // Verify user has access to this team (or is ADMIN)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { role: true }
    });

    // Allow ADMIN users to create submissions for any team
    if (user?.role !== 'ADMIN') {
      const teamMember = await prisma.podTeamMember.findUnique({
        where: {
          podTeamId_userId: {
            podTeamId: teamId,
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

    // Determine which photos to use
    let photos: Array<{ s3Key: string; url?: string; position: number; caption: string; status: string }>;

    if (uploadedPhotos && uploadedPhotos.length > 0) {
      // Use uploaded photos with their captions
      photos = uploadedPhotos.map((photo: any, index: number) => ({
        s3Key: photo.s3Key,
        url: photo.url,
        position: index,
        caption: photo.caption || '',
        status: 'PENDING_REVIEW',
      }));
      console.log('Using uploaded photos:', photos.length);
    } else {
      // Use static photos for Drive link (placeholder - Phase 2 will fetch from Drive)
      // TODO: Phase 2 - fetch photos from Google Drive and create real WallPostPhoto records
      photos = [
        { s3Key: 'static/photo-1.jpg', url: 'https://picsum.photos/seed/1/400/600', position: 0, caption: '', status: 'PENDING_REVIEW' },
        { s3Key: 'static/photo-2.jpg', url: 'https://picsum.photos/seed/2/400/600', position: 1, caption: '', status: 'PENDING_REVIEW' },
        { s3Key: 'static/photo-3.jpg', url: 'https://picsum.photos/seed/3/400/600', position: 2, caption: '', status: 'PENDING_REVIEW' },
        { s3Key: 'static/photo-4.jpg', url: 'https://picsum.photos/seed/4/400/600', position: 3, caption: '', status: 'PENDING_REVIEW' },
        { s3Key: 'static/photo-5.jpg', url: 'https://picsum.photos/seed/5/400/600', position: 4, caption: '', status: 'PENDING_REVIEW' },
        { s3Key: 'static/photo-6.jpg', url: 'https://picsum.photos/seed/6/400/600', position: 5, caption: '', status: 'PENDING_REVIEW' },
        { s3Key: 'static/photo-7.jpg', url: 'https://picsum.photos/seed/7/400/600', position: 6, caption: '', status: 'PENDING_REVIEW' },
        { s3Key: 'static/photo-8.jpg', url: 'https://picsum.photos/seed/8/400/600', position: 7, caption: '', status: 'PENDING_REVIEW' },
      ];
      console.log('Using placeholder photos for Drive link');
    }

    const task = await prisma.task.create({
      data: {
        title: `Wall Post - ${modelName}`,
        description: uploadedPhotos && uploadedPhotos.length > 0
          ? `Bulk submission with ${photos.length} uploaded photos.\n\nEach photo can be edited individually with its own caption and status.`
          : `Bulk submission from Drive link: ${driveLink}\n\n${photos.length} photos ready for review. Each photo can be edited individually with its own caption and status.`,
        status: taskStatus,
        priority: 'MEDIUM',
        podTeamId: teamId,
        createdById: session.user.id!,
        wallPostSubmission: {
          create: {
            modelName,
            driveLink: driveLink || '',
            podTeamId: teamId,
            createdById: session.user.id!,
            status: taskStatus,
            photos: {
              create: photos,
            },
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        podTeam: {
          select: {
            id: true,
            name: true,
            projectPrefix: true,
          },
        },
        wallPostSubmission: {
          include: {
            photos: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Bulk submission created for ${modelName}. Processing will create individual posts.`,
      task,
      metadata: {
        modelName,
        driveLink,
        columnStatus,
      },
    });

  } catch (error) {
    console.error('Error creating bulk submission:', error);
    return NextResponse.json(
      { error: 'Failed to create bulk submission' },
      { status: 500 }
    );
  }
}
