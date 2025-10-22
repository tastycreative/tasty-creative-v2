import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.json({ error: "Admin or Moderator role required" }, { status: 403 });
    }

    // Fetch all available creators/client models
    const clientModels = await prisma.clientModel.findMany({
      select: {
        id: true,
        clientName: true,
        profilePicture: true,
        profileLink: true
      },
      orderBy: {
        clientName: 'asc'
      }
    });

    const creators = clientModels.map(model => ({
      id: model.id,
      name: model.clientName,
      image: model.profileLink || model.profilePicture
    })).filter(creator => creator.name);

    return NextResponse.json(creators);

  } catch (error) {
    console.error('Error fetching available creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available creators' },
      { status: 500 }
    );
  }
}