import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const accountKey = searchParams.get('accountKey');

    // Build the query
    const where: any = {
      userId: session.user.id,
    };

    // Filter by account key if provided
    if (accountKey) {
      where.accountKey = accountKey;
    }

    // Get user's voice note history
    // @ts-ignore - Prisma Client needs to be regenerated in IDE
    const history = await prisma.voiceNoteHistory.findMany({
      where,
      orderBy: {
        generatedAt: 'desc',
      },
      take: 100, // Limit to last 100 entries
    });

    return NextResponse.json({
      items: history.map((item: any) => ({
        history_item_id: item.elevenLabsHistoryId,
        text: item.text,
        voice_id: item.voiceId,
        voice_name: item.voiceName,
        date_unix: Math.floor(item.generatedAt.getTime() / 1000),
        account_key: item.accountKey, // Include account key to show which profile was used
      })),
      pagination: {
        pageIndex: 1,
        pageSize: 100,
        totalItems: history.length,
        totalPages: 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching voice note history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch voice note history' },
      { status: 500 }
    );
  }
}
