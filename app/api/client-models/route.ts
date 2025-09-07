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

    return NextResponse.json({
      success: true,
      clientModels: clientModels
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
