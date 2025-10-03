import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reactionSchema = z.object({
  type: z.enum(["LIKE", "HELPFUL", "LOVE", "LAUGH", "CONFUSED", "ANGRY"]),
});

// POST /api/models/[modelId]/forum/posts/[postId]/reactions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string; postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = reactionSchema.parse(body);
    const { postId } = await params;

    // Check if user already reacted to this post
    const existingReaction = await prisma.postReaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Remove reaction if clicking the same type
        await prisma.postReaction.delete({
          where: {
            postId_userId: {
              postId,
              userId: session.user.id,
            },
          },
        });
        return NextResponse.json({ message: "Reaction removed" });
      } else {
        // Update reaction type
        await prisma.postReaction.update({
          where: {
            postId_userId: {
              postId,
              userId: session.user.id,
            },
          },
          data: { type },
        });
        return NextResponse.json({ message: "Reaction updated", type });
      }
    } else {
      // Create new reaction
      await prisma.postReaction.create({
        data: {
          postId,
          userId: session.user.id,
          type,
        },
      });
      return NextResponse.json({ message: "Reaction added", type }, { status: 201 });
    }
  } catch (error) {
    console.error("Error handling reaction:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid reaction type", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/models/[modelId]/forum/posts/[postId]/reactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string; postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { postId } = await params;

    // Get reaction counts
    const reactions = await prisma.postReaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { type: true },
    });

    // Get user's reaction if any
    const userReaction = session.user.id ? await prisma.postReaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    }) : null;

    const transformedReactions = reactions.map((reaction) => ({
      type: reaction.type,
      count: reaction._count.type,
    }));

    return NextResponse.json({
      reactions: transformedReactions,
      userReaction: userReaction?.type || null,
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}