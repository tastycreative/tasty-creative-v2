import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

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
    let photos: Array<{ s3Key?: string; url?: string; position: number; caption: string; status: string }>;

    if (uploadedPhotos && uploadedPhotos.length > 0) {
      // Option 1: Use uploaded photos with their S3 keys
      photos = uploadedPhotos.map((photo: any, index: number) => ({
        s3Key: photo.s3Key,
        url: photo.url,
        position: index,
        caption: photo.caption || '',
        status: 'PENDING_REVIEW',
      }));
      console.log('Using uploaded photos with S3 keys:', photos.length);
    } else if (driveLink) {
      // Option 2: Fetch images from Google Drive link
      console.log('Fetching images from Google Drive link...');

      try {
        // Set up OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.NEXTAUTH_URL
        );

        oauth2Client.setCredentials({
          access_token: session.accessToken,
          refresh_token: session.refreshToken,
          expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
        });

        const drive = google.drive({ version: "v3", auth: oauth2Client });

        // Extract folder/file ID from Drive URL
        const extractIdFromUrl = (url: string): string | null => {
          const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
          if (folderMatch) return folderMatch[1];

          const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          if (fileMatch) return fileMatch[1];

          const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (openMatch) return openMatch[1];

          return null;
        };

        const resourceId = extractIdFromUrl(driveLink);

        if (!resourceId) {
          throw new Error('Invalid Google Drive URL format');
        }

        // Get resource metadata
        const resourceMetadata = await drive.files.get({
          fileId: resourceId,
          fields: "id, name, mimeType",
          supportsAllDrives: true,
        });

        const isFolder = resourceMetadata.data.mimeType === "application/vnd.google-apps.folder";
        let driveImages: any[] = [];

        if (isFolder) {
          // Fetch all images from folder
          const listResponse = await drive.files.list({
            q: `'${resourceId}' in parents and (mimeType contains 'image/')`,
            spaces: "drive",
            fields: "files(id, name, mimeType, thumbnailLink, webViewLink, webContentLink)",
            pageSize: 1000,
            orderBy: "name",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
          });

          driveImages = listResponse.data.files || [];
        } else {
          // Single file - check if it's an image
          const isImage = resourceMetadata.data.mimeType?.includes('image/');

          if (isImage) {
            const fileMetadata = await drive.files.get({
              fileId: resourceId,
              fields: "id, name, mimeType, thumbnailLink, webViewLink, webContentLink",
              supportsAllDrives: true,
            });
            driveImages = [fileMetadata.data];
          }
        }

        if (driveImages.length === 0) {
          throw new Error('No images found in the provided Google Drive location');
        }

        // Map Drive images to photo records with file IDs (no S3 key for Drive-sourced images)
        // Store as drive://FILE_ID format so we can identify and proxy them later
        photos = driveImages.map((image: any, index: number) => ({
          s3Key: null, // No S3 key for Drive images
          url: `drive://${image.id}`, // Store Drive file ID with custom protocol for identification
          position: index,
          caption: '', // No captions for Drive images
          status: 'PENDING_REVIEW',
        }));

        console.log(`Fetched ${photos.length} images from Google Drive`);
      } catch (driveError: any) {
        console.error('Error fetching images from Google Drive:', driveError);
        throw new Error(`Failed to fetch images from Google Drive: ${driveError.message}`);
      }
    } else {
      throw new Error('Either uploadedPhotos or driveLink must be provided');
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
