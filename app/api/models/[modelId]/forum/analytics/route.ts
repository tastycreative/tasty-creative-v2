import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { modelId } = await params;
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to view analytics (ADMIN or MANAGER)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || ![UserRole.ADMIN, UserRole.MANAGER].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const startDate = new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000);

    // Get basic forum stats
    const [
      totalThreads,
      totalReplies,
      totalUsers,
      activeThreads,
      pinnedThreads,
      solvedThreads,
      totalViews
    ] = await Promise.all([
      // Total threads
      prisma.forumThread.count({
        where: { modelId }
      }),
      
      // Total replies
      prisma.forumComment.count({
        where: { thread: { modelId } }
      }),
      
      // Total unique users who posted
      prisma.forumThread.findMany({
        where: { modelId },
        select: { authorId: true }
      }).then(threads => {
        const uniqueAuthors = new Set(threads.map(t => t.authorId));
        return uniqueAuthors.size;
      }),
      
      // Active threads (with recent activity)
      prisma.forumThread.count({
        where: {
          modelId,
          updatedAt: { gte: startDate }
        }
      }),
      
      // Pinned threads
      prisma.forumThread.count({
        where: {
          modelId,
          isPinned: true
        }
      }),
      
      // Solved threads
      prisma.forumThread.count({
        where: {
          modelId,
          isSolved: true
        }
      }),
      
      // Total views
      prisma.forumThread.aggregate({
        where: { modelId },
        _sum: { views: true }
      }).then(result => result._sum.views || 0)
    ]);

    // Get activity over time (daily stats for the timeframe)
    const dailyStats = await prisma.$queryRaw<Array<{
      date: string;
      threads: number;
      replies: number;
      views: number;
    }>>`
      WITH date_series AS (
        SELECT generate_series(
          date_trunc('day', NOW() - INTERVAL '${parseInt(timeframe)} days'),
          date_trunc('day', NOW()),
          INTERVAL '1 day'
        )::date AS date
      ),
      thread_stats AS (
        SELECT 
          date_trunc('day', "createdAt")::date AS date,
          COUNT(*)::int AS threads,
          SUM("views")::int AS views
        FROM "ForumThread"
        WHERE "modelId" = ${modelId}
          AND "createdAt" >= NOW() - INTERVAL '${parseInt(timeframe)} days'
        GROUP BY date_trunc('day', "createdAt")::date
      ),
      reply_stats AS (
        SELECT 
          date_trunc('day', fc."createdAt")::date AS date,
          COUNT(*)::int AS replies
        FROM "ForumComment" fc
        JOIN "ForumThread" ft ON fc."threadId" = ft.id
        WHERE ft."modelId" = ${modelId}
          AND fc."createdAt" >= NOW() - INTERVAL '${parseInt(timeframe)} days'
        GROUP BY date_trunc('day', fc."createdAt")::date
      )
      SELECT 
        ds.date::text,
        COALESCE(ts.threads, 0) AS threads,
        COALESCE(rs.replies, 0) AS replies,
        COALESCE(ts.views, 0) AS views
      FROM date_series ds
      LEFT JOIN thread_stats ts ON ds.date = ts.date
      LEFT JOIN reply_stats rs ON ds.date = rs.date
      ORDER BY ds.date;
    `;

    // Get top categories by thread count
    const topCategories = await prisma.forumCategory.findMany({
      where: { modelId },
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: { threads: true }
        }
      },
      orderBy: {
        threads: { _count: 'desc' }
      },
      take: 10
    });

    // Get most active users
    const mostActiveUsers = await prisma.user.findMany({
      where: {
        forumThreads: {
          some: { modelId }
        }
      },
      select: {
        id: true,
        name: true,
        image: true,
        _count: {
          select: {
            forumThreads: {
              where: { modelId }
            },
            forumComments: {
              where: { thread: { modelId } }
            }
          }
        }
      },
      orderBy: [
        {
          forumThreads: { _count: 'desc' }
        },
        {
          forumComments: { _count: 'desc' }
        }
      ],
      take: 10
    });

    // Get recent moderation actions
    const recentModerations = await prisma.moderationLog.findMany({
      where: {
        thread: { modelId }
      },
      include: {
        moderator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        thread: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Calculate engagement metrics
    const avgRepliesPerThread = totalThreads > 0 ? totalReplies / totalThreads : 0;
    const avgViewsPerThread = totalThreads > 0 ? totalViews / totalThreads : 0;

    return NextResponse.json({
      overview: {
        totalThreads,
        totalReplies,
        totalUsers,
        totalViews,
        activeThreads,
        pinnedThreads,
        solvedThreads,
        avgRepliesPerThread: Math.round(avgRepliesPerThread * 100) / 100,
        avgViewsPerThread: Math.round(avgViewsPerThread * 100) / 100
      },
      activity: dailyStats,
      categories: topCategories,
      activeUsers: mostActiveUsers,
      moderation: recentModerations,
      timeframe: parseInt(timeframe)
    });

  } catch (error) {
    console.error('Error fetching forum analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}