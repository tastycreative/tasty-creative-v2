
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { title, content, htmlContent } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title and content." },
        { status: 400 }
      );
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

    // Create a Google Doc
    const fileMetadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.document',
    };

    // Create the document
    const driveResponse = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id,webViewLink,webContentLink',
    });

    const documentId = driveResponse.data.id;

    if (!documentId) {
      throw new Error("Failed to create document");
    }

    // Use Google Docs API to add content
    const docs = google.docs({ version: "v1", auth: oauth2Client });

    // Insert content into the document
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: content,
            },
          },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      documentId,
      webViewLink: driveResponse.data.webViewLink,
      webContentLink: driveResponse.data.webContentLink,
      message: "Script uploaded successfully to Google Drive",
    });

  } catch (error: any) {
    console.error("Error uploading script:", error);
    
    // Handle Google API permission errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission to create Google Docs."}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to upload script", 
        details: error.message,
        message: "An error occurred while uploading your script to Google Drive"
      },
      { status: 500 }
    );
  }
}
