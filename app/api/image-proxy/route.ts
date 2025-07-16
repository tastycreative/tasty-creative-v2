/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "googleapis";
import { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("id");
  const imageUrl = req.nextUrl.searchParams.get("url");

  // Proxy external image (e.g. Google profile pic)
  if (imageUrl) {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) {
        return new Response("Failed to fetch external image", { status: res.status });
      }

      const contentType = res.headers.get("content-type") || "image/jpeg";
      return new Response(res.body, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (err) {
      console.error("External image proxy error:", err);
      return new Response("Failed to fetch external image", { status: 500 });
    }
  }

  // Proxy Google Drive image (default)
  if (!fileId) {
    return new Response("Missing file ID or URL", { status: 400 });
  }

  try {
    const session = await auth();
    if (!session || !session.user || !session.accessToken) {
      return new Response("Not authenticated", { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileRes = await drive.files.get(
      {
        fileId,
        alt: "media",
      },
      { responseType: "stream" }
    );

    const contentType = fileRes.headers["content-type"] ?? "image/jpeg";

    return new Response(fileRes.data as any, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });

  } catch (error: any) {
    console.error("Drive proxy error:", error);

    if (error.code === 403 && error.errors?.length > 0) {
      return new Response(`Google API Error: ${error.errors[0].message}`, { status: 403 });
    }
    if (error.code === 404) {
      return new Response("File not found", { status: 404 });
    }
    return new Response("Failed to proxy image", { status: 500 });
  }
}
