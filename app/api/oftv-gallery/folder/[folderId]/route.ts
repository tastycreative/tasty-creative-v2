import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const folderName = decodeURIComponent(params.folderId);

    // Fetch all items in this folder
    const items = await prisma.oFTVGalleryItem.findMany({
      where: {
        folderName: folderName === 'Uncategorized' ? null : folderName
      },
      include: {
        gallery: {
          include: {
            clientModel: {
              select: {
                clientName: true
              }
            }
          }
        }
      },
      orderBy: [
        { position: 'asc' },
        { fileName: 'asc' }
      ]
    });

    // Transform the data
    const transformedItems = items.map((item: any) => ({
      id: item.id,
      fileName: item.fileName,
      fileType: item.fileType,
      folderName: item.folderName,
      folderDriveId: item.folderDriveLink,
      fileUrl: item.fileUrl,
      thumbnailUrl: item.thumbnailUrl,
      fileSize: item.fileSize,
      durationMillis: item.durationMillis,
      width: item.width,
      height: item.height,
      mimeType: item.mimeType,
      position: item.position,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      clientModel: item.gallery.clientModel.clientName,
      galleryId: item.galleryId
    }));

    return NextResponse.json({
      items: transformedItems,
      folderName,
      totalItems: transformedItems.length
    });

  } catch (error) {
    console.error('Error fetching folder items:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch folder items',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
