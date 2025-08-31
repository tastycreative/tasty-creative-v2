import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    // Fetch all client models from database
    const clientModels = await prisma.clientModel.findMany({
      include: {
        contentDetails: true
      },
      orderBy: {
        clientName: 'asc'
      }
    });

    // Transform the data to match the expected ModelDetails format
    const models = clientModels.map((model) => {
      // Parse comma-separated strings to arrays
      const parseCommaSeparated = (str: string | null): string[] => {
        if (!str) return [];
        return str.split(',').map(item => item.trim()).filter(item => item);
      };


      // Transform to match ModelDetails interface
      return {
        id: model.id,
        name: model.clientName,
        status: (model.status?.toLowerCase() === 'active' ? 'active' : 'dropped') as 'active' | 'dropped',
        launchDate: model.launchDate || '',
        referrerName: model.referrer || '',
        personalityType: model.personalityType || '',
        commonTerms: parseCommaSeparated(model.commonTerms),
        commonEmojis: parseCommaSeparated(model.commonEmojis),
        instagram: model.mainInstagram || undefined,
        twitter: model.mainTwitter || undefined,
        tiktok: model.mainTiktok || undefined,
        chattingManagers: parseCommaSeparated(model.generalNotes), // Using generalNotes as fallback
        profileImage: model.profileLink || undefined,
        // Additional fields for compatibility
        profile: model.profileLink || '',
        percentTaken: model.percentTaken,
        guaranteed: model.guaranteed,
        notes: model.notes,
        generalNotes: model.generalNotes,
        restrictedTermsEmojis: model.restrictedTermsEmojis,
        profileLink: model.profileLink,
        contentDetails: model.contentDetails[0] || null,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt
      };
    });

    return NextResponse.json({ 
      models,
      count: models.length 
    });

  } catch (error) {
    console.error('Error fetching models from database:', error);
    return NextResponse.json(
      { error: "Failed to fetch models from database" },
      { status: 500 }
    );
  }
}