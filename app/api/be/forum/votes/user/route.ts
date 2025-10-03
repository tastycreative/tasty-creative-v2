// src/app/api/be/forum/votes/user/route.ts

import { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Import and get user data from Prisma to get the username
    const { prisma } = await import("../../../../../../lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, email: true, name: true }
    });

    if (!user || !user.username) {
      return new Response("Username not found", { status: 400 });
    }

    // Mock user votes data - in real implementation this would come from database
    // For now, return empty arrays since user hasn't voted on anything yet
    const userVotesData = {
      postVotes: [] as Array<{ postId: number; type: "upvote" | "downvote" }>,
      commentVotes: [] as Array<{ commentId: number; type: "upvote" | "downvote" }>
    };

    return Response.json(userVotesData);
  } catch (err) {
    console.error("Forum get user votes error:", err);
    return new Response("Failed to get user votes", { status: 500 });
  }
}
