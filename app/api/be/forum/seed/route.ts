// src/app/api/be/forum/seed/route.ts

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:3000";

export async function POST() {
  const backendUrl = `${BACKEND_URL}/forum/seed`;

  try {
    const fetchRes = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
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
    console.error("Forum seed proxy error:", err);
    return new Response("Failed to seed forum data", { status: 500 });
  }
}
