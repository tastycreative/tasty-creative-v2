// src/app/api/be/forum/votes/route.ts

import { NextRequest } from "next/server";
import { auth } from "@/auth";

// Mock user votes storage (in real implementation this would be in database)
const userVotes = new Map<string, Map<string, 'upvote' | 'downvote'>>();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
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
    const { type, target, postId, commentId } = body;
    
    // Get or create user votes map
    if (!userVotes.has(session.user.id)) {
      userVotes.set(session.user.id, new Map());
    }
    const userVoteMap = userVotes.get(session.user.id)!;
    
    // Generate vote key
    const voteKey = target === 'post' ? `post_${postId}` : `comment_${commentId}`;
    
    // Check existing vote
    const existingVote = userVoteMap.get(voteKey);
    const isSameVote = existingVote === type;
    
    // Toggle vote logic
    if (isSameVote) {
      // Remove vote if same type
      userVoteMap.delete(voteKey);
    } else {
      // Set new vote
      userVoteMap.set(voteKey, type as 'upvote' | 'downvote');
    }

    // In a real implementation, you would update the database here
    // For now, we'll just return a mock response
    const newScore = Math.floor(Math.random() * 100); // Mock new score

    return Response.json({
      message: isSameVote ? "Vote removed" : "Vote recorded",
      newScore
    });
  } catch (err) {
    console.error("Forum vote error:", err);
    return new Response("Failed to process forum vote", { status: 500 });
  }
}
