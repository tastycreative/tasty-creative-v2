import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/models/[modelId]/forum/threads/[threadId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string; threadId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { modelId, threadId } = await params;

    // Find the thread with posts and related data
    const thread = await prisma.thread.findFirst({
      where: {
        id: threadId,
        modelId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            role: true,
          },
        },
        category: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        posts: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
                role: true,
              },
            },
            reactions: true,
            attachments: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            posts: true,
            watchers: true,
          },
        },
        watchers: {
          where: { userId: session.user.id },
          select: { id: true },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.thread.update({
      where: { id: threadId },
      data: { views: { increment: 1 } },
    });

    // Transform the data
    const transformedThread = {
      id: thread.id,
      modelId: thread.modelId,
      title: thread.title,
      categoryKey: thread.category.key.toLowerCase(),
      author: thread.author,
      pinned: thread.pinned,
      locked: thread.locked,
      solved: thread.solved,
      views: thread.views + 1, // Include the increment
      postCount: thread._count.posts,
      watcherCount: thread._count.watchers,
      watching: thread.watchers.length > 0,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      posts: thread.posts.map((post) => ({
        id: post.id,
        content_md: post.content_md,
        content_html: post.content_html,
        author: post.author,
        createdAt: post.createdAt.toISOString(),
        reactions: post.reactions.reduce((acc, reaction) => {
          const existing = acc.find((r) => r.type === reaction.type);
          if (existing) {
            existing.count += 1;
          } else {
            acc.push({ type: reaction.type, count: 1 });
          }
          return acc;
        }, [] as { type: string; count: number }[]),
        attachments: post.attachments?.map((att) => ({
          id: att.id,
          url: att.url,
          filename: att.filename,
          type: att.type,
          size: att.size,
        })) || [],
      })),
    };

    return NextResponse.json(transformedThread);
  } catch (error) {
    console.error("Error fetching thread:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}