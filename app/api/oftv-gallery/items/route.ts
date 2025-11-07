import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientModel = searchParams.get('clientModel');

    // Build where clause
    const whereClause: any = {};
    
    if (clientModel) {
      // Find the gallery for this client model
      const gallery = await prisma.oFTVGallery.findFirst({
        where: {
          clientModel: {
            clientName: clientModel
          }
        },
        select: {
          id: true
        }
      });

      if (gallery) {
        whereClause.galleryId = gallery.id;
      } else {
        // No gallery found for this client model
        return NextResponse.json({
          items: [],
          clientModels: []
        });
      }
    }

    // Fetch all gallery items with client model information
    const items = await prisma.oFTVGalleryItem.findMany({
      where: whereClause,
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
        { createdAt: 'desc' }
      ]
    });

    // Get all client models with item counts
    const clientModels = await prisma.oFTVGallery.findMany({
      include: {
        clientModel: {
          select: {
            clientName: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      }
    });

    // Transform the data
    const transformedItems = items.map(item => ({
      id: item.id,
      fileName: item.fileName,
      fileType: item.fileType,
      folderName: item.folderName,
      folderDriveId: item.folderDriveLink, // You may need to store this separately in your schema
      fileUrl: item.fileUrl,
      thumbnailUrl: item.thumbnailUrl,
      mimeType: item.mimeType,
      position: item.position,
      createdAt: item.createdAt.toISOString(),
      clientModel: item.gallery.clientModel.clientName,
      galleryId: item.galleryId
    }));

    const transformedClientModels = clientModels.map(gallery => ({
      id: gallery.id,
      name: gallery.clientModel.clientName,
      itemCount: gallery._count.items
    }));

    return NextResponse.json({
      items: transformedItems,
      clientModels: transformedClientModels
    });

  } catch (error) {
    console.error('Error fetching gallery items:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch gallery items',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
