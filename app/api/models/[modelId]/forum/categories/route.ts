import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/models/[modelId]/forum/categories
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { modelId } = await params;

    // Get categories with thread counts
    const categories = await prisma.forumCategory.findMany({
      where: { modelId },
      include: {
        _count: {
          select: {
            Thread: true,
          },
        },
      },
      orderBy: {
        key: "asc",
      },
    });

    // Transform the data
    const transformedCategories = categories.map((category) => ({
      id: category.id,
      modelId: category.modelId,
      key: category.key.toLowerCase(),
      name: category.name,
      threadCount: category._count.Thread,
    }));

    return NextResponse.json(transformedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}