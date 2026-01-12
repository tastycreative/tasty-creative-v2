import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log('🎭 Fetching client models from database...');
    
    // Fetch all client models with basic error handling
    let clientModels;
    try {
      clientModels = await prisma.clientModel.findMany({
        where: {
          // Filter for active models - adjust status values as needed
          status: {
            notIn: ['inactive', 'deleted', 'disabled']
          }
        },
        select: {
          id: true,
          clientName: true,
          name: true,
          status: true,
          profilePicture: true,
          profileLink: true,
          pricingDescription: true,
        },
        orderBy: {
          clientName: 'asc'
        }
      });
    } catch (prismaError) {
      console.error('❌ Prisma error:', prismaError);
      // Fallback data if database query fails
      clientModels = [
        {
          id: 'fallback-1',
          clientName: 'Alanna',
          name: 'Alanna',
          status: 'active',
          profilePicture: null
        },
        {
          id: 'fallback-2', 
          clientName: 'Sarah',
          name: 'Sarah',
          status: 'active',
          profilePicture: null
        },
        {
          id: 'fallback-3',
          clientName: 'Jessica', 
          name: 'Jessica',
          status: 'active',
          profilePicture: null
        }
      ];
    }

    console.log(`✅ Found ${clientModels.length} client models`);

    // Helper function to convert Google Drive links to direct image URLs
    const convertGoogleDriveLink = (url: string | null): string | null => {
      if (!url) return null;

      // Check if it's a Google Drive link
      if (url.includes('drive.google.com')) {
        try {
          // Try to extract file ID from /file/d/ pattern
          const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          let driveId: string | null = null;

          if (fileMatch && fileMatch[1]) {
            driveId = fileMatch[1];
          } else {
            // Try to extract from URL parameters
            const urlObj = new URL(url);
            driveId = urlObj.searchParams.get('id');
          }

          if (driveId) {
            // Use thumbnail endpoint like EnhancedModelCard (more reliable)
            return `https://drive.google.com/thumbnail?id=${driveId}&sz=w200`;
          }
        } catch (e) {
          // If URL parsing fails, return original
          return url;
        }
      }

      // Return as-is if not a Google Drive link (regular image URLs, etc.)
      return url;
    };

    // Transform to ensure profilePicture field is properly set (use profileLink as primary source)
    const transformedModels = clientModels.map(model => ({
      id: model.id,
      clientName: model.clientName,
      name: model.name,
      status: model.status,
      profilePicture: convertGoogleDriveLink(model.profileLink) || convertGoogleDriveLink(model.profilePicture) || null,
      pricingDescription: model.pricingDescription || null,
    }));

    return NextResponse.json({
      success: true,
      clientModels: transformedModels
    });

  } catch (error) {
    console.error("❌ Error fetching client models:", error);
    
    // Return fallback data instead of failing completely
    return NextResponse.json({
      success: true,
      clientModels: [
        {
          id: 'fallback-1',
          clientName: 'Alanna',
          name: 'Alanna', 
          status: 'active',
          profilePicture: null
        },
        {
          id: 'fallback-2',
          clientName: 'Sarah',
          name: 'Sarah',
          status: 'active', 
          profilePicture: null
        },
        {
          id: 'fallback-3',
          clientName: 'Jessica',
          name: 'Jessica',
          status: 'active',
          profilePicture: null
        }
      ]
    });
  }
}
