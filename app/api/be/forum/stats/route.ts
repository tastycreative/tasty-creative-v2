// src/app/api/be/forum/stats/route.ts

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:3000";

export async function GET() {
  const backendUrl = `${BACKEND_URL}/forum/stats`;

  try {
    const fetchRes = await fetch(backendUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!fetchRes.ok) {
      return new Response("Failed to fetch forum stats", {
        status: fetchRes.status,
      });
    }

    const data = await fetchRes.json();
    return Response.json(data);
  } catch (err) {
    console.error("Forum stats proxy error:", err);
    return new Response("Failed to retrieve forum stats", { status: 500 });
  }
}
