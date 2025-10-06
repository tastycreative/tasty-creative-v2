// src/app/api/be/forum/comments/route.ts

import { NextRequest } from "next/server";
import { auth } from "../../../../../auth";
import { ForumComment } from "../../../../lib/forum-api";

// Import mock posts data from posts route (in real implementation this would be database)
// For now, create a simple reference to the mock data
declare global {
  var mockPosts: any[] | undefined;
  var nextCommentId: number | undefined;
}

export async function POST(request: NextRequest) {
  try {
    // Get session information
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Import and get user data from Prisma to get the username
    const { prisma } = await import("../../../../../lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, email: true, name: true }
    });

    if (!user || !user.username) {
      return new Response("Username not found", { status: 400 });
    }

    const body = await request.json();
    
    // Create new comment
    const newComment: ForumComment = {
      id: global.nextCommentId || 100, // Use a high starting number to avoid conflicts
      content: body.content,
      author: {
        id: parseInt(session.user.id.slice(-3), 36), // Generate a numeric ID from string ID
        username: user.username,
        avatar: user.username.substring(0, 2).toUpperCase()
      },
      upvotes: 0,
      downvotes: 0,
      score: 0,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    global.nextCommentId = (global.nextCommentId || 100) + 1;

    // In a real implementation, you would add the comment to the database
    // For now, we'll just return the comment (the frontend handles adding it to the UI)
    
    return Response.json(newComment);
  } catch (err) {
    console.error("Forum comment creation error:", err);
    return new Response("Failed to create forum comment", { status: 500 });
  }
}
