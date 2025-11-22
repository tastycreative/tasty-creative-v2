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

      // Special handling for Google Drive URLs (both thumbnail and sharing URLs)
      if (imageUrl.includes("drive.google.com")) {
        let driveId = null;

        // Handle thumbnail URLs
        if (imageUrl.includes("drive.google.com/thumbnail")) {
          const urlObj = new URL(imageUrl);
          driveId = urlObj.searchParams.get("id");
        }
        // Handle sharing URLs like /file/d/FILE_ID/view
        else if (imageUrl.includes("drive.google.com/file/d/")) {
          const match = imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          if (match) {
            driveId = match[1];
          }
        }
        // Handle uc URLs like /uc?export=view&id=FILE_ID
        else if (imageUrl.includes("drive.google.com/uc")) {
          const urlObj = new URL(imageUrl);
          driveId = urlObj.searchParams.get("id");
        }

        if (driveId) {
          console.log(
            "Detected Google Drive file, using authenticated access for ID:",
            driveId
          );

          // Try different authentication methods
          let drive;

          // First, try with API key for public files
          if (process.env.AUTH_API_KEY) {
            console.log("Trying API key authentication");
            try {
              drive = google.drive({
                version: "v3",
                auth: process.env.AUTH_API_KEY,
              });

              // Test if we can access the file with API key
              const testRes = await drive.files.get({
                fileId: driveId,
                fields: "id,name,permissions",
              });

              console.log("API key authentication successful");
            } catch (apiKeyError) {
              console.log(
                "API key authentication failed, trying session auth:",
                apiKeyError.message
              );
              drive = null;
            }
          }

          // If API key failed, try session-based authentication
          if (!drive) {
            const session = await auth();
            if (!session || !session.user || !session.accessToken) {
              return new Response(
                "Authentication not available - need user login",
                { status: 401 }
              );
            }

            console.log("Using session-based authentication");
            const oauth2Client = new google.auth.OAuth2(
              process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
              process.env.AUTH_GOOGLE_SECRET ||
                process.env.GOOGLE_CLIENT_SECRET,
              process.env.NEXTAUTH_URL
            );

            oauth2Client.setCredentials({
              access_token: session.accessToken,
              refresh_token: session.refreshToken,
              expiry_date: session.expiresAt
                ? session.expiresAt * 1000
                : undefined,
            });

            drive = google.drive({ version: "v3", auth: oauth2Client });
          }

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
      process.env.NEXTAUTH_URL
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
