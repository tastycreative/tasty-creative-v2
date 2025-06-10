/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    // Get session using Auth.js
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated. No access token." },
        { status: 401 }
      );
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
    const folderId = "1Mo3i9lUmfyT5vfgTddPV-PnYbquTEqwL";

    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, webViewLink, thumbnailLink)",
    });

    return NextResponse.json({ files: res.data.files || [] });

  } catch (error: any) {
    console.error("Google Drive API error:", error);
    
    // Handle Google API specific errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json({
        error: "GooglePermissionDenied",
        message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for Google Drive."}`,
      }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch drive items" },
      { status: 500 }
    );
  }
}