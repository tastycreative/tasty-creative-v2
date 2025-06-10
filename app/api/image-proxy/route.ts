/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "googleapis";
import { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("id");
  if (!fileId) {
    return new Response("Missing file ID", { status: 400 });
  }

  try {
    // Get session using Auth.js
    const session = await auth();
    
    if (!session || !session.user) {
      return new Response("Not authenticated", { status: 401 });
    }

    if (!session.accessToken) {
      return new Response("Not authenticated. No access token.", { status: 401 });
    }

    // Set up OAuth2 client with Auth.js session
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
    console.error("Proxy fetch error:", error);
    
    // Handle Google API specific errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return new Response(
        `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for Google Drive."}`,
        { status: 403 }
      );
    }

    // Handle file not found errors
    if (error.code === 404) {
      return new Response("File not found", { status: 404 });
    }

    return new Response("Failed to proxy image", { status: 500 });
  }
}