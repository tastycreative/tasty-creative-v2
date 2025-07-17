// src/app/api/be/forum/posts/route.ts

import { NextRequest } from "next/server";
import { auth } from "../../../../../auth";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/forum/posts?${searchParams.toString()}`;

  try {
    // Get session information for authenticated requests
    const session = await auth();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // If user is authenticated, pass user information to backend
    if (session?.user?.id) {
      try {
        // Import and get user data from Prisma to get the username
        const { prisma } = await import("../../../../../lib/prisma");
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { username: true, email: true, name: true }
        });

        if (user) {
          headers["x-user-id"] = session.user.id;
          headers["x-user-email"] = user.email || session.user.email || "";
          headers["x-user-name"] = user.name || session.user.name || "";
          if (user.username) {
            headers["x-user-username"] = user.username;
          }
        }
      } catch (prismaError) {
        console.error("Error fetching user data for posts GET:", prismaError);
        // Continue without user headers if there's an error
      }
    }

    const fetchRes = await fetch(backendUrl, {
      headers,
    });

    if (!fetchRes.ok) {
      return new Response("Failed to fetch posts", {
        status: fetchRes.status,
      });
    }

    const data = await fetchRes.json();
    return Response.json(data);
  } catch (err) {
    console.error("Forum posts proxy error:", err);
    return new Response("Failed to retrieve forum posts", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const backendUrl = `${BACKEND_URL}/forum/posts`;

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
    
    const fetchRes = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Pass user information to backend
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
    console.error("Forum post creation proxy error:", err);
    return new Response("Failed to create forum post", { status: 500 });
  }
}
