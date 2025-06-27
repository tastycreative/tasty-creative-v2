
import { NextResponse } from "next/server";
import { google } from "googleapis";
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

    // Set up OAuth2 client with Auth.js session tokens
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

    // Search for Google Docs in the same folder where scripts are saved
    const SCRIPTS_FOLDER_ID = "1mwWO8WRT60DDdJTSLvkejhFuJUrNFBwC";
    
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.document' and '${SCRIPTS_FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime, modifiedTime, webViewLink, size)',
      orderBy: 'modifiedTime desc',
      pageSize: 50, // Limit to 50 most recent documents
    });

    const documents = response.data.files || [];

    return NextResponse.json({ 
      documents: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        createdTime: doc.createdTime,
        modifiedTime: doc.modifiedTime,
        webViewLink: doc.webViewLink,
        size: doc.size
      }))
    });

  } catch (error: any) {
    console.error("Error fetching documents:", error);

    // Handle Google API permission errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission to access Google Drive."}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch documents", details: error.message },
      { status: 500 }
    );
  }
}
