// src/app/api/be/forum/users/route.ts

import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  const backendUrl = `${BACKEND_URL}/forum/users`;

  try {
    const body = await request.json();
    
    const fetchRes = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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
    console.error("Forum user creation proxy error:", err);
    return new Response("Failed to create forum user", { status: 500 });
  }
}
