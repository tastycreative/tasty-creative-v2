import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// Toggle watch status for a thread
export async function POST(
  req: NextRequest,
  { params }: { params: { modelId: string; threadId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if thread exists
    const thread = await prisma.thread.findFirst({
      where: {
        id: params.threadId,
        modelId: params.modelId,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Check if user is already watching
    const existingWatch = await prisma.threadWatcher.findUnique({
      where: {
        threadId_userId: {
          threadId: params.threadId,
          userId: session.user.id,
        },
      },
    });

    if (existingWatch) {
      // Unwatch the thread
      await prisma.threadWatcher.delete({
        where: {
          id: existingWatch.id,
        },
      });

      return NextResponse.json({
        watching: false,
        message: "Stopped watching thread",
      });
    } else {
      // Watch the thread
      await prisma.threadWatcher.create({
        data: {
          threadId: params.threadId,
          userId: session.user.id,
        },
      });

      return NextResponse.json({
        watching: true,
        message: "Now watching thread for updates",
      });
    }
  } catch (error) {
    console.error("Error toggling thread watch:", error);
    return NextResponse.json(
      { error: "Failed to toggle thread watch" },
      { status: 500 }
    );
  }
}

// Get watch status for current user
export async function GET(
  req: NextRequest,
  { params }: { params: { modelId: string; threadId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ watching: false });
    }

    const watcher = await prisma.threadWatcher.findUnique({
      where: {
        threadId_userId: {
          threadId: params.threadId,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      watching: !!watcher,
      watchedAt: watcher?.createdAt,
    });
  } catch (error) {
    console.error("Error checking watch status:", error);
    return NextResponse.json({ watching: false });
  }
}