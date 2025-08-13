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
      console.log("Fetching external image:", imageUrl);

      // Special handling for Google Drive thumbnail URLs
      if (imageUrl.includes("drive.google.com/thumbnail")) {
        const urlObj = new URL(imageUrl);
        const driveId = urlObj.searchParams.get("id");
        if (driveId) {
          console.log(
            "Detected Google Drive thumbnail, using authenticated access for ID:",
            driveId
          );
          // Redirect to the authenticated drive endpoint
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
            expiry_date: session.expiresAt
              ? session.expiresAt * 1000
              : undefined,
          });

          const drive = google.drive({ version: "v3", auth: oauth2Client });

          const fileRes = await drive.files.get(
            {
              fileId: driveId,
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
        }
      }

      // Try with browser-like headers for other external images
      const res = await fetch(imageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Cache-Control": "no-cache",
        },
      });
      console.log("External image response status:", res.status);
      console.log(
        "External image response headers:",
        Object.fromEntries(res.headers.entries())
      );

      if (!res.ok) {
        console.error(
          "External image fetch failed:",
          res.status,
          res.statusText
        );
        return new Response("Failed to fetch external image", {
          status: res.status,
        });
      }

      const contentType = res.headers.get("content-type") || "image/jpeg";
      console.log("External image content type:", contentType);

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
      return new Response(`Google API Error: ${error.errors[0].message}`, {
        status: 403,
      });
    }
    if (error.code === 404) {
      return new Response("File not found", { status: 404 });
    }
    return new Response("Failed to proxy image", { status: 500 });
  }
}
