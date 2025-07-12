// src/app/api/be/forum/comments/[id]/route.ts

import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const backendUrl = `${BACKEND_URL}/forum/comments/${id}`;

  try {
    const fetchRes = await fetch(backendUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!fetchRes.ok) {
      return new Response("Failed to fetch comment", {
        status: fetchRes.status,
      });
    }

    const data = await fetchRes.json();
    return Response.json(data);
  } catch (err) {
    console.error("Forum comment proxy error:", err);
    return new Response("Failed to retrieve forum comment", { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const backendUrl = `${BACKEND_URL}/forum/comments/${id}`;

  try {
    const body = await request.json();
    
    const fetchRes = await fetch(backendUrl, {
      method: "PATCH",
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
    console.error("Forum comment update proxy error:", err);
    return new Response("Failed to update forum comment", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const backendUrl = `${BACKEND_URL}/forum/comments/${id}`;

  try {
    const fetchRes = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    if (!fetchRes.ok) {
      return new Response("Failed to delete comment", {
        status: fetchRes.status,
      });
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Forum comment delete proxy error:", err);
    return new Response("Failed to delete forum comment", { status: 500 });
  }
}
