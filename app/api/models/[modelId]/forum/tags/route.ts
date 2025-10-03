import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

// Get all tags for a model
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const { modelId } = await params;
    const tags = await prisma.forumTag.findMany({
      where: {
        modelId: modelId,
      },
      include: {
        _count: {
          select: {
            threads: true,
          },
        },
      },
      orderBy: [
        {
          threads: {
            _count: "desc",
          },
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        threadCount: tag._count.threads,
        createdAt: tag.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

// Create a new tag
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to create tags (USER+ role)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role === "GUEST") {
      return NextResponse.json(
        { error: "Insufficient permissions to create tags" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = createTagSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, color = "#6366F1" } = validation.data;

    // Create slug from name
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-');

    // Check if tag with this slug already exists for this model
    const existingTag = await prisma.forumTag.findUnique({
      where: {
        modelId_slug: {
          slug: slug,
          modelId: modelId,
        },
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 409 }
      );
    }

    const tag = await prisma.forumTag.create({
      data: {
        name: name.trim(),
        slug: slug,
        color,
        modelId: modelId,
      },
    });

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        threadCount: 0,
        createdAt: tag.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}