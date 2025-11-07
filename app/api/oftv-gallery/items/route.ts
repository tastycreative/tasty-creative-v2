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
    const page = parseInt(searchParams.get('page') || '1');
    const foldersPerPage = 5; // Number of folders per page instead of items
    const search = searchParams.get('search');
    
    // We don't use skip/take at database level anymore
    // Instead, we'll fetch all items and paginate by folders

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
          clientModels: [],
          pagination: {
            page: 1,
            foldersPerPage: 5,
            totalItems: 0,
            totalFolders: 0,
            totalPages: 0,
            itemsOnCurrentPage: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        });
      }
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { folderName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination (by folders, not items)
    const totalItems = await prisma.oFTVGalleryItem.count({
      where: whereClause
    });

    // Fetch ALL items that match the criteria (we'll paginate by folders on the server)
    const allItems = await prisma.oFTVGalleryItem.findMany({
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
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Group items by folder
    const folderMap = new Map<string, any[]>();
    allItems.forEach((item: any) => {
      const folderKey = item.folderName || 'Uncategorized';
      if (!folderMap.has(folderKey)) {
        folderMap.set(folderKey, []);
      }
      folderMap.get(folderKey)!.push(item);
    });

    // Convert to array and sort folders by most recent item in each folder
    const folders = Array.from(folderMap.entries()).map(([folderName, items]) => ({
      folderName,
      items,
      mostRecentUpdate: Math.max(...items.map((item: any) => new Date(item.updatedAt).getTime()))
    })).sort((a, b) => b.mostRecentUpdate - a.mostRecentUpdate);

    const totalFolders = folders.length;
    const totalPages = Math.ceil(totalFolders / foldersPerPage);

    // Paginate by folders
    const startFolderIndex = (page - 1) * foldersPerPage;
    const endFolderIndex = startFolderIndex + foldersPerPage;
    const paginatedFolders = folders.slice(startFolderIndex, endFolderIndex);

    // Flatten the items from paginated folders
    const items = paginatedFolders.flatMap(folder => folder.items);

    // Get all client models with item counts (not paginated)
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

    const transformedClientModels = clientModels.map((gallery: any) => ({
      id: gallery.id,
      name: gallery.clientModel.clientName,
      itemCount: gallery._count.items
    }));

    return NextResponse.json({
      items: transformedItems,
      clientModels: transformedClientModels,
      pagination: {
        page,
        foldersPerPage,
        totalItems,
        totalFolders,
        totalPages,
        itemsOnCurrentPage: transformedItems.length,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
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
