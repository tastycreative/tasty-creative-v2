// src/app/api/be/forum/votes/route.ts

import { NextRequest } from "next/server";
import { auth } from "@/auth";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const backendUrl = `${BACKEND_URL}/forum/votes`;

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
    
    const fetchRes = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-user-id": session.user.id,
        "x-user-email": user.email || session.user.email || "",
        "x-user-name": user.name || session.user.name || "",
        "x-user-username": user.username, // Pass the actual username from Prisma
      },
      body: JSON.stringify(body),
    });

    if (!fetchRes.ok) {
      const errorData = await fetchRes.json().catch(() => ({}));
      return new Response(JSON.stringify(errorData), {
        status: fetchRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await fetchRes.json();
    return Response.json(data);
  } catch (err) {
    console.error("Forum vote proxy error:", err);
    return new Response("Failed to process forum vote", { status: 500 });
  }
}
