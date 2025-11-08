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
    const sortBy = searchParams.get('sortBy') || 'video-number-asc';
    
    // Helper function to extract video number from folder name or filename
    const extractVideoNumber = (name: string): number => {
      // Try to match patterns like "Video 123", "video123", "123", etc.
      const patterns = [
        /video[_\s-]*(\d+)/i,  // Matches "Video 123", "video_123", "Video-123"
        /(\d+)[_\s-]*video/i,  // Matches "123 Video", "123_video"
        /^(\d+)/,              // Matches leading number "123-something"
        /\((\d+)\)/,           // Matches "(123)"
        /#(\d+)/,              // Matches "#123"
      ];
      
      for (const pattern of patterns) {
        const match = name.match(pattern);
        if (match && match[1]) {
          return parseInt(match[1], 10);
        }
      }
      
      // If no number found, return 0 (will be sorted last)
      return 0;
    };
    
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
    // Order by folderName first so "Video 1" comes before "Video 10" (natural sort)
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
      orderBy: [
        { folderName: 'asc' },  // Sort by folder name first (Video 1, Video 10, Video 2...)
        { position: 'asc' },     // Then by position within folder
        { fileName: 'asc' }      // Then by filename as fallback
      ]
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

    // Convert to array and sort folders based on sortBy parameter
    const folders = Array.from(folderMap.entries()).map(([folderName, items]) => {
      const dates = items.map((item: any) => new Date(item.updatedAt).getTime());
      const sizes = items.map((item: any) => item.fileSize || 0);
      const durations = items.map((item: any) => item.durationMillis || 0);
      const folderVideoNumber = extractVideoNumber(folderName || '');
      
      return {
        folderName,
        items,
        folderVideoNumber,
        mostRecentUpdate: Math.max(...dates),
        oldestUpdate: Math.min(...dates),
        totalSize: sizes.reduce((sum, size) => sum + size, 0),
        totalDuration: durations.reduce((sum, duration) => sum + duration, 0)
      };
    }).sort((a, b) => {
      switch (sortBy) {
        case 'video-number-desc':
          // Sort folders by video number in folder name (highest/newest first)
          // If video numbers are equal, sort by full folder name alphabetically (case-insensitive)
          if (b.folderVideoNumber !== a.folderVideoNumber) {
            return b.folderVideoNumber - a.folderVideoNumber;
          }
          return (a.folderName || 'Uncategorized').localeCompare(
            b.folderName || 'Uncategorized',
            undefined,
            { sensitivity: 'base' }
          );
        
        case 'video-number-asc':
          // Sort folders by video number in folder name (lowest/oldest first)
          // If video numbers are equal, sort by full folder name alphabetically (case-insensitive)
          if (a.folderVideoNumber !== b.folderVideoNumber) {
            return a.folderVideoNumber - b.folderVideoNumber;
          }
          return (a.folderName || 'Uncategorized').localeCompare(
            b.folderName || 'Uncategorized',
            undefined,
            { sensitivity: 'base' }
          );
        
        case 'newest':
          // Sort folders by most recent item (newest first)
          return b.mostRecentUpdate - a.mostRecentUpdate;
        
        case 'oldest':
          // Sort folders by oldest item (oldest first)
          return a.oldestUpdate - b.oldestUpdate;
        
        case 'name-asc':
          // Sort folders alphabetically A-Z
          return (a.folderName || 'Uncategorized').localeCompare(b.folderName || 'Uncategorized');
        
        case 'name-desc':
          // Sort folders alphabetically Z-A
          return (b.folderName || 'Uncategorized').localeCompare(a.folderName || 'Uncategorized');
        
        case 'size-desc':
          // Sort folders by total size (largest first)
          return b.totalSize - a.totalSize;
        
        case 'size-asc':
          // Sort folders by total size (smallest first)
          return a.totalSize - b.totalSize;
        
        case 'duration-desc':
          // Sort folders by total duration (longest first)
          return b.totalDuration - a.totalDuration;
        
        case 'duration-asc':
          // Sort folders by total duration (shortest first)
          return a.totalDuration - b.totalDuration;
        
        default:
          // Default: sort by video number ascending (Video 1, Video 2, Video 3...)
          // If video numbers are equal, sort by full folder name alphabetically (case-insensitive)
          if (a.folderVideoNumber !== b.folderVideoNumber) {
            return a.folderVideoNumber - b.folderVideoNumber;
          }
          return (a.folderName || 'Uncategorized').localeCompare(
            b.folderName || 'Uncategorized',
            undefined,
            { sensitivity: 'base' }
          );
      }
    });

    // Sort items within each folder based on sortBy parameter
    folders.forEach(folder => {
      folder.items.sort((a: any, b: any) => {
        switch (sortBy) {
          case 'video-number-desc':
          case 'video-number-asc':
            // For video number sorting, keep items in their natural order within folder
            // Or sort by position if available, otherwise by filename
            if (a.position !== null && b.position !== null) {
              return a.position - b.position;
            }
            return a.fileName.localeCompare(b.fileName);
          case 'newest':
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          case 'oldest':
            return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          case 'name-asc':
            return a.fileName.localeCompare(b.fileName);
          case 'name-desc':
            return b.fileName.localeCompare(a.fileName);
          case 'size-desc':
            return (b.fileSize || 0) - (a.fileSize || 0);
          case 'size-asc':
            return (a.fileSize || 0) - (b.fileSize || 0);
          case 'duration-desc':
            return (b.durationMillis || 0) - (a.durationMillis || 0);
          case 'duration-asc':
            return (a.durationMillis || 0) - (b.durationMillis || 0);
          default:
            if (a.position !== null && b.position !== null) {
              return a.position - b.position;
            }
            return a.fileName.localeCompare(b.fileName);
        }
      });
    });

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
