import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const moderateSchema = z.object({
  action: z.enum(["pin", "unpin", "lock", "unlock", "solve", "unsolve"]),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ modelId: string; threadId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = moderateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { action, reason } = validation.data;
    const { modelId, threadId } = await params;

    // Check if user has moderation permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // Only ADMIN and MANAGER can moderate
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions for moderation" },
        { status: 403 }
      );
    }

    // Check if thread exists
    const thread = await prisma.thread.findFirst({
      where: {
        id: threadId,
        modelId: modelId,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Prepare update data based on action
    let updateData: any = {};
    let actionDescription = "";

    switch (action) {
      case "pin":
        updateData.pinned = true;
        actionDescription = "pinned the thread";
        break;
      case "unpin":
        updateData.pinned = false;
        actionDescription = "unpinned the thread";
        break;
      case "lock":
        updateData.locked = true;
        actionDescription = "locked the thread";
        break;
      case "unlock":
        updateData.locked = false;
        actionDescription = "unlocked the thread";
        break;
      case "solve":
        updateData.solved = true;
        actionDescription = "marked the thread as solved";
        break;
      case "unsolve":
        updateData.solved = false;
        actionDescription = "unmarked the thread as solved";
        break;
    }

    // Update thread and create moderation log
    const [updatedThread, moderationLog] = await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: updateData,
        include: {
          User: {
            select: {
              id: true,
              username: true,
              image: true,
              role: true,
            },
          },
          ForumCategory: true,
          _count: {
            select: {
              Post: true,
            },
          },
        },
      }),
      prisma.moderationLog.create({
        data: {
          actorId: session.user.id,
          action: action.toUpperCase() as any,
          targetType: "THREAD",
          targetId: threadId,
          reason: reason || `User ${actionDescription}`,
          // metadata: {
          //   modelId: modelId,
          //   threadTitle: thread.title,
          // },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      thread: {
        id: updatedThread.id,
        title: updatedThread.title,
        pinned: updatedThread.pinned,
        locked: updatedThread.locked,
        solved: updatedThread.solved,
        author: updatedThread.User,
        category: updatedThread.ForumCategory,
        postCount: updatedThread._count.Post,
        createdAt: updatedThread.createdAt,
        updatedAt: updatedThread.updatedAt,
      },
      moderation: {
        action: actionDescription,
        moderator: session.user.email || session.user.name,
        timestamp: moderationLog.createdAt,
      },
    });
  } catch (error) {
    console.error("Error moderating thread:", error);
    return NextResponse.json(
      { error: "Failed to moderate thread" },
      { status: 500 }
    );
  }
}

// Get moderation history for a thread
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ modelId: string; threadId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId } = await params;

    const logs = await prisma.moderationLog.findMany({
      where: {
        targetId: threadId,
        targetType: "THREAD",
      },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        reason: log.reason,
        actor: log.User,
        createdAt: log.createdAt,
        // metadata: log.metadata || {},
      })),
    });
  } catch (error) {
    console.error("Error fetching moderation history:", error);
    return NextResponse.json(
      { error: "Failed to fetch moderation history" },
      { status: 500 }
    );
  }
}