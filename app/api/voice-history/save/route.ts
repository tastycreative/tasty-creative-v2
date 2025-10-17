import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { elevenLabsHistoryId, voiceId, voiceName, accountKey, text, generatedAt } = await request.json();

    if (!elevenLabsHistoryId || !voiceId || !voiceName || !accountKey || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save or update the voice note history
    // @ts-ignore - Prisma Client needs to be regenerated in IDE
    const voiceNote = await prisma.voiceNoteHistory.upsert({
      where: {
        userId_elevenLabsHistoryId: {
          userId: session.user.id,
          elevenLabsHistoryId,
        },
      },
      update: {
        // Update in case it already exists
        voiceName,
        text,
      },
      create: {
        userId: session.user.id,
        elevenLabsHistoryId,
        voiceId,
        voiceName,
        accountKey,
        text,
        generatedAt: generatedAt ? new Date(generatedAt) : new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      voiceNote,
    });
  } catch (error: any) {
    console.error('Error saving voice note history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save voice note history' },
      { status: 500 }
    );
  }
}
