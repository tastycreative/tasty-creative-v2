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
    const limit = parseInt(searchParams.get('limit') || '50');
    const actorId = searchParams.get('actorId');
    const targetUserId = searchParams.get('targetUserId');
    const actionType = searchParams.get('actionType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where condition
    const where: any = {};
    
    if (actorId) {
      where.actorId = actorId;
    }
    
    if (targetUserId) {
      where.targetUserId = targetUserId;
    }
    
    if (actionType) {
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

    const skip = (page - 1) * limit;

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
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.userActivityHistory.count({ where });

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page < Math.ceil(totalCount / limit)
      }
    });

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
