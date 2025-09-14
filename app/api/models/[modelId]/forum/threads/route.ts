import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schemas
const threadsQuerySchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["recent", "newest", "oldest", "most_replied", "most_viewed"]).default("recent"),
  filters: z.array(z.enum(["open", "solved", "pinned", "my_threads", "watching"])).default([]),
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const createThreadSchema = z.object({
  title: z.string().min(1).max(200),
  categoryKey: z.enum(["GENERAL", "QA", "BUGS", "SHOWCASE", "RELEASES"]),
  content: z.string().min(1).max(50000),
});

// GET /api/models/[modelId]/forum/threads
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = threadsQuerySchema.parse({
      category: searchParams.get("category") || undefined,
      sort: searchParams.get("sort") || undefined,
      filters: searchParams.getAll("filters"),
      search: searchParams.get("search") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    const { modelId } = await params;

    // Build where clause
    const where: any = {
      modelId,
      ...(query.category && query.category !== "all" && {
        category: {
          key: query.category.toUpperCase() as "GENERAL" | "QA" | "BUGS" | "SHOWCASE" | "RELEASES",
        },
      }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          {
            posts: {
              some: {
                content_md: { contains: query.search, mode: "insensitive" },
              },
            },
          },
        ],
      }),
      ...(query.filters.includes("open") && { solved: false }),
      ...(query.filters.includes("solved") && { solved: true }),
      ...(query.filters.includes("pinned") && { pinned: true }),
      ...(query.filters.includes("my_threads") && { authorId: session.user.id }),
      ...(query.filters.includes("watching") && {
        watchers: {
          some: { userId: session.user.id },
        },
      }),
    };

    // Build orderBy clause
    let orderBy: any = {};
    switch (query.sort) {
      case "recent":
        orderBy = { updatedAt: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "most_replied":
        orderBy = { posts: { _count: "desc" } };
        break;
      case "most_viewed":
        orderBy = { views: "desc" };
        break;
    }

    // Cursor pagination
    const cursorCondition = query.cursor ? { id: { gt: query.cursor } } : {};

    const threads = await prisma.thread.findMany({
      where: { ...where, ...cursorCondition },
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
      orderBy,
      take: query.limit + 1, // Take one extra to check if there's a next page
    });

    const hasMore = threads.length > query.limit;
    const threadsToReturn = hasMore ? threads.slice(0, -1) : threads;
    const nextCursor = hasMore ? threadsToReturn[threadsToReturn.length - 1].id : null;

    // Transform the data
    const transformedThreads = threadsToReturn.map((thread) => ({
      id: thread.id,
      modelId: thread.modelId,
      title: thread.title,
      categoryKey: thread.category.key.toLowerCase(),
      author: {
        id: thread.author.id,
        username: thread.author.username,
        name: thread.author.name,
        image: thread.author.image,
        role: thread.author.role,
      },
      pinned: thread.pinned,
      locked: thread.locked,
      solved: thread.solved,
      views: thread.views,
      postCount: thread._count.posts,
      watcherCount: thread._count.watchers,
      watching: thread.watchers.length > 0,
      lastActivity: thread.updatedAt.toISOString(),
      createdAt: thread.createdAt.toISOString(),
    }));

    return NextResponse.json({
      threads: transformedThreads,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/models/[modelId]/forum/threads
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
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
    const { title, categoryKey, content } = createThreadSchema.parse(body);
    const { modelId } = await params;

    // Find or create category
    let category = await prisma.forumCategory.findFirst({
      where: {
        modelId,
        key: categoryKey,
      },
    });

    if (!category) {
      // Create default categories for this model
      const defaultCategories = [
        { key: "GENERAL", name: "General" },
        { key: "QA", name: "Q&A" },
        { key: "BUGS", name: "Bugs" },
        { key: "SHOWCASE", name: "Showcase" },
        { key: "RELEASES", name: "Releases" },
      ] as const;

      await prisma.forumCategory.createMany({
        data: defaultCategories.map((cat) => ({
          modelId,
          key: cat.key,
          name: cat.name,
        })),
        skipDuplicates: true,
      });

      category = await prisma.forumCategory.findFirst({
        where: {
          modelId,
          key: categoryKey,
        },
      });
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 400 }
      );
    }

    // Create thread and first post in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const thread = await tx.thread.create({
        data: {
          modelId,
          categoryId: category.id,
          title,
          authorId: session.user.id,
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
        },
      });

      const post = await tx.post.create({
        data: {
          threadId: thread.id,
          authorId: session.user.id,
          content_md: content,
          content_html: content, // TODO: Process markdown to HTML
        },
      });

      return { thread, post };
    });

    // TODO: Add moderation logging once ModerationAction enum is updated
    // Currently commented out as "CREATE" is not a valid ModerationAction
    // await prisma.moderationLog.create({
    //   data: {
    //     actorId: session.user.id,
    //     targetType: "THREAD",
    //     targetId: result.thread.id,
    //     action: "CREATE",
    //   },
    // });

    return NextResponse.json(
      {
        id: result.thread.id,
        modelId: result.thread.modelId,
        title: result.thread.title,
        categoryKey: result.thread.category.key.toLowerCase(),
        author: result.thread.author,
        pinned: result.thread.pinned,
        locked: result.thread.locked,
        solved: result.thread.solved,
        views: result.thread.views,
        createdAt: result.thread.createdAt.toISOString(),
        updatedAt: result.thread.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating thread:", error);
    
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