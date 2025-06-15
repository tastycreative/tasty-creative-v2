
import { NextRequest } from "next/server";
import path from "path";

export async function GET(req: NextRequest) {
  const encodedPath = req.nextUrl.searchParams.get("path"); // optional Base64 encoded
  const rawUrl = req.nextUrl.searchParams.get("url"); // raw encodedURIComponent

  try {
    const finalPath = encodedPath
      ? decodeURIComponent(atob(encodedPath))
      : decodeURIComponent(rawUrl || "").replace(/\//g, "\\");

    const backendUrl = `https://be.tastycreative.xyz/media-viewer/stream?path=${encodeURIComponent(finalPath)}`;

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