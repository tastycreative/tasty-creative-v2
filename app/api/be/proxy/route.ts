// src/app/api/be/proxy/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const encodedPath = req.nextUrl.searchParams.get("path");
  const encodedUrl = req.nextUrl.searchParams.get("url");

  try {
    const decodedPath = encodedPath ? atob(encodedPath) : null;
    const backendUrl = `https://be.tastycreative.xyz/media-viewer/stream?path=${encodeURIComponent(encodedPath ? decodedPath || "" : encodeURIComponent(encodedUrl || ""))}`;

    const fetchRes = await fetch(backendUrl, {
      headers: {
        Range: req.headers.get("range") || "",
      },
    });

    const headers = new Headers(fetchRes.headers);
    return new Response(fetchRes.body, {
      status: fetchRes.status,
      headers,
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response("Failed to stream media", { status: 500 });
  }
}
