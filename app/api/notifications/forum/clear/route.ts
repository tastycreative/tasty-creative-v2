import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/notifications/forum/clear
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Mark all forum notifications as read for this user
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        type: 'SYSTEM_NOTIFICATION',
        data: {
          path: ['category'],
          equals: 'forum'
        },
        isRead: false // Only update unread notifications
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({
      success: true,
      clearedCount: result.count
    });
  } catch (error) {
    console.error("Error clearing forum notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}