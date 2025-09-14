import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateTagsSchema = z.object({
  tagIds: z.array(z.string()),
});

// Get tags for a specific thread
export async function GET(
  req: NextRequest,
  { params }: { params: { modelId: string; threadId: string } }
) {
  try {
    const threadTags = await prisma.threadTag.findMany({
      where: {
        threadId: params.threadId,
      },
      include: {
        tag: true,
      },
    });

    return NextResponse.json({
      tags: threadTags.map((threadTag) => ({
        id: threadTag.tag.id,
        name: threadTag.tag.name,
        color: threadTag.tag.color,
      })),
    });
  } catch (error) {
    console.error("Error fetching thread tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread tags" },
      { status: 500 }
    );
  }
}

// Update tags for a thread
export async function PUT(
  req: NextRequest,
  { params }: { params: { modelId: string; threadId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateTagsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { tagIds } = validation.data;

    // Check if thread exists and user has permission
    const thread = await prisma.thread.findFirst({
      where: {
        id: params.threadId,
        modelId: params.modelId,
      },
      include: {
        author: true,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Check permissions: thread author, or ADMIN/MANAGER can edit tags
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const canEditTags =
      thread.authorId === session.user.id ||
      (user && ["ADMIN", "MANAGER"].includes(user.role));

    if (!canEditTags) {
      return NextResponse.json(
        { error: "Insufficient permissions to edit thread tags" },
        { status: 403 }
      );
    }

    // Verify all tagIds exist and belong to this model
    if (tagIds.length > 0) {
      const validTags = await prisma.tag.findMany({
        where: {
          id: { in: tagIds },
          modelId: params.modelId,
        },
      });

      if (validTags.length !== tagIds.length) {
        return NextResponse.json(
          { error: "Some tags are invalid or don't exist" },
          { status: 400 }
        );
      }
    }

    // Update thread tags atomically
    await prisma.$transaction(async (tx) => {
      // Remove existing tags
      await tx.threadTag.deleteMany({
        where: {
          threadId: params.threadId,
        },
      });

      // Add new tags
      if (tagIds.length > 0) {
        await tx.threadTag.createMany({
          data: tagIds.map((tagId) => ({
            threadId: params.threadId,
            tagId,
          })),
        });
      }
    });

    // Fetch updated tags
    const updatedThreadTags = await prisma.threadTag.findMany({
      where: {
        threadId: params.threadId,
      },
      include: {
        tag: true,
      },
    });

    return NextResponse.json({
      success: true,
      tags: updatedThreadTags.map((threadTag) => ({
        id: threadTag.tag.id,
        name: threadTag.tag.name,
        color: threadTag.tag.color,
      })),
    });
  } catch (error) {
    console.error("Error updating thread tags:", error);
    return NextResponse.json(
      { error: "Failed to update thread tags" },
      { status: 500 }
    );
  }
}