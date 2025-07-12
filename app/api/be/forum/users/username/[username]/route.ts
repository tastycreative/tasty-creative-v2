// src/app/api/be/forum/users/username/[username]/route.ts

import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  const backendUrl = `${BACKEND_URL}/forum/users/username/${username}`;

  try {
    const fetchRes = await fetch(backendUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!fetchRes.ok) {
      return new Response("Failed to fetch user", {
        status: fetchRes.status,
      });
    }

    const data = await fetchRes.json();
    return Response.json(data);
  } catch (err) {
    console.error("Forum user by username proxy error:", err);
    return new Response("Failed to retrieve forum user", { status: 500 });
  }
}
