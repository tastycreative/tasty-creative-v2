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

    // First try to get the file metadata to check if it has a thumbnailLink
    try {
      const fileMetadata = await drive.files.get({
        fileId,
        fields: 'thumbnailLink,mimeType,name'
      });

      console.log('File metadata:', {
        id: fileId,
        name: fileMetadata.data.name,
        mimeType: fileMetadata.data.mimeType,
        hasThumbnailLink: !!fileMetadata.data.thumbnailLink
      });

      // If Google Drive has a thumbnail, use that
      if (fileMetadata.data.thumbnailLink) {
        const thumbnailRes = await fetch(fileMetadata.data.thumbnailLink, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        });

        if (thumbnailRes.ok) {
          const contentType = thumbnailRes.headers.get("content-type") || "image/jpeg";
          return new Response(thumbnailRes.body, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      }
    } catch (metadataError) {
      console.log('Failed to get file metadata, trying direct media access:', metadataError);
    }

    // Fallback to direct media access for images
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
    console.error("Drive proxy error for file:", fileId, error);

    if (error.code === 403 && error.errors?.length > 0) {
      console.error("Permissions error:", error.errors[0].message);
      return new Response(`Google API Error: ${error.errors[0].message}`, { status: 403 });
    }
    if (error.code === 404) {
      console.error("File not found:", fileId);
      return new Response("File not found", { status: 404 });
    }
    
    // For any other error, return a placeholder image
    console.error("Returning placeholder due to error:", error.message);
    return new Response("Failed to proxy image", { status: 500 });
  }
}
