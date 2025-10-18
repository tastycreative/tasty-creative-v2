import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("🧪 Testing forum API connectivity...");

    // Test basic database connection
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);

    // Test Thread model
    const threadCount = await prisma.thread.count();
    console.log(`📊 Total threads in database: ${threadCount}`);

    // Test ForumCategory model
    const categoryCount = await prisma.forumCategory.count();
    console.log(`📊 Total forum categories in database: ${categoryCount}`);

    // Test Post model
    const postCount = await prisma.post.count();
    console.log(`📊 Total posts in database: ${postCount}`);

    return NextResponse.json({
      success: true,
      message: "Forum API connectivity test successful",
      data: {
        users: userCount,
        threads: threadCount,
        categories: categoryCount,
        posts: postCount
      }
    });
  } catch (error) {
    console.error("❌ Forum API test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}