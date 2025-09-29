import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications/forum
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Verify the user can only access their own notifications
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get forum notifications for the user
    // Since we don't have forum-specific notification types yet,
    // we'll use SYSTEM_NOTIFICATION and filter by metadata or return empty for now
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        type: 'SYSTEM_NOTIFICATION',
        // Add additional filtering by data/metadata if needed
        data: {
          path: ['category'],
          equals: 'forum'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
      include: {
        user: {
          select: {
            username: true,
            name: true,
            image: true
          }
        }
      }
    });

    // Transform to ForumNotification format
    const forumNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type === 'FORUM_REPLY' ? 'new_reply' :
            notification.type === 'FORUM_MENTION' ? 'mention' : 'thread_update',
      threadId: notification.entityId || '', // Assuming entityId contains threadId
      threadTitle: notification.title || 'Forum Discussion',
      modelId: notification.metadata?.modelId || 'unknown',
      message: notification.message,
      author: {
        username: notification.user.username || notification.user.name || 'Anonymous',
        image: notification.user.image
      },
      createdAt: notification.createdAt,
      read: notification.isRead
    }));

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return NextResponse.json({
      notifications: forumNotifications,
      unreadCount
    });
  } catch (error) {
    console.error("Error fetching forum notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/notifications/forum/clear
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Mark all forum notifications as read for this user
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        type: 'SYSTEM_NOTIFICATION',
        data: {
          path: ['category'],
          equals: 'forum'
        }
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing forum notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}