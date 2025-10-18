import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin or moderator
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const role = session.user.role as string;
    if (role !== 'ADMIN' && role !== 'MODERATOR') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all voice generations with user information
    // @ts-ignore - Prisma Client needs to be regenerated in IDE
    const generations = await prisma.voiceNoteHistory.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
      take: 1000, // Limit to last 1000 generations for performance
    });

    // Calculate user statistics
    const userStatsMap = new Map();

    generations.forEach((gen: any) => {
      const userId = gen.userId;
      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          userId,
          userName: gen.user.name || 'Unknown',
          userEmail: gen.user.email || 'No email',
          totalGenerations: 0,
          totalCredits: 0,
          lastGeneration: gen.generatedAt,
        });
      }

      const stats = userStatsMap.get(userId);
      stats.totalGenerations += 1;
      stats.totalCredits += gen.charactersUsed || 0;
      
      // Update last generation if this one is more recent
      if (new Date(gen.generatedAt) > new Date(stats.lastGeneration)) {
        stats.lastGeneration = gen.generatedAt;
      }
    });

    // Convert map to array and add average
    const userStats = Array.from(userStatsMap.values()).map((stats: any) => ({
      ...stats,
      averageCredits: stats.totalGenerations > 0 
        ? Math.round(stats.totalCredits / stats.totalGenerations) 
        : 0,
    }));

    // Format generations for response
    const formattedGenerations = generations.map((gen: any) => ({
      id: gen.id,
      userId: gen.userId,
      userName: gen.user.name || 'Unknown',
      userEmail: gen.user.email || 'No email',
      voiceName: gen.voiceName,
      text: gen.text,
      charactersUsed: gen.charactersUsed || 0,
      accountKey: gen.accountKey,
      generatedAt: gen.generatedAt,
      createdAt: gen.createdAt,
    }));

    return NextResponse.json({
      success: true,
      generations: formattedGenerations,
      userStats,
      summary: {
        totalGenerations: generations.length,
        totalCreditsUsed: generations.reduce((sum: number, gen: any) => sum + (gen.charactersUsed || 0), 0),
        uniqueUsers: userStatsMap.size,
      },
    });
  } catch (error: any) {
    console.error('Error fetching generations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch generations' },
      { status: 500 }
    );
  }
}
