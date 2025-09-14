import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPostSchema = z.object({
  content: z.string().min(1).max(50000),
  parentPostId: z.string().optional(),
});

// POST /api/models/[modelId]/forum/threads/[threadId]/posts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string; threadId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user has username
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, role: true },
    });

    if (!user?.username) {
      return NextResponse.json(
        { error: "Username required to participate in forum" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content } = createPostSchema.parse(body);
    const { modelId, threadId } = await params;

    // Verify thread exists and is not locked
    const thread = await prisma.thread.findFirst({
      where: {
        id: threadId,
        modelId,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.locked) {
      return NextResponse.json({ error: "Thread is locked" }, { status: 403 });
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        threadId,
        authorId: session.user.id,
        content_md: content,
        content_html: content, // TODO: Process markdown to HTML
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
      },
    });

    // Update thread's updatedAt timestamp
    await prisma.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(
      {
        id: post.id,
        content_md: post.content_md,
        content_html: post.content_html,
        author: post.author,
        createdAt: post.createdAt.toISOString(),
        reactions: [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating post:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}