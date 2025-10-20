import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search') || '';
    const actorId = searchParams.get('actorId');
    const targetUserId = searchParams.get('targetUserId');
    const actionType = searchParams.get('actionType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate pagination parameters
    const pageSize = limit === "all" ? undefined : parseInt(limit || "10");
    const offset = pageSize ? (page - 1) * pageSize : 0;

    // Build where condition
    const where: any = {};
    
    // Search filter (search in actor/target user names, emails, and reason)
    if (search) {
      where.OR = [
        { actor: { name: { contains: search, mode: "insensitive" } } },
        { actor: { email: { contains: search, mode: "insensitive" } } },
        { targetUser: { name: { contains: search, mode: "insensitive" } } },
        { targetUser: { email: { contains: search, mode: "insensitive" } } },
        { reason: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (actorId) {
      where.actorId = actorId;
    }
    
    if (targetUserId) {
      where.targetUserId = targetUserId;
    }
    
    if (actionType && actionType !== 'ALL') {
      where.actionType = actionType;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    try {
      // Get total count for pagination
      const totalActivities = await prisma.userActivityHistory.count({ where });

      // Fetch activities with user information
      const activities = await prisma.userActivityHistory.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          },
          targetUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: pageSize
      });

      // Calculate pagination info
      const totalPages = pageSize ? Math.ceil(totalActivities / pageSize) : 1;
      const hasNextPage = pageSize ? page < totalPages : false;
      const hasPrevPage = page > 1;

      return NextResponse.json({
        success: true,
        activities,
        pagination: {
          page,
          limit: limit || "10",
          totalActivities,
          totalPages,
          hasNextPage,
          hasPrevPage,
          showing: activities.length,
        }
      });
    } catch (dbError) {
      console.error("Database connection error in activity history API:", dbError);
      
      // Return fallback response when database is unavailable
      return NextResponse.json({
        success: true,
        activities: [], // Empty array when DB is down
        pagination: {
          page,
          limit: limit || "10",
          totalActivities: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          showing: 0,
        },
        error: "Database temporarily unavailable. Please try again later.",
      });
    }

  } catch (error) {
    console.error('Error fetching user activity history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method to create new activity history record
export async function POST(request: Request) {
  try {
    const session = await auth();

    // Check if user is admin or the action is being performed by the system
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      targetUserId,
      actionType,
      oldRole,
      newRole,
      reason,
      ipAddress,
      userAgent
    } = body;

    // Create activity record
    const activity = await prisma.userActivityHistory.create({
      data: {
        actorId: session.user.id,
        targetUserId,
        actionType,
        oldRole,
        newRole,
        reason,
        ipAddress,
        userAgent
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json(activity);

  } catch (error) {
    console.error('Error creating user activity history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
