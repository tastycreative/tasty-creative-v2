/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

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
    const { title, content } = body;

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
      refresh_token: session.refreshToken, // Optional fallback if available
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileMetadata = {
      name: title,
      mimeType: "application/vnd.google-apps.document",
      parents: ["1mwWO8WRT60DDdJTSLvkejhFuJUrNFBwC"], // Folder ID
    };

    const driveResponse = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id,webViewLink,webContentLink",
    });

    const documentId = driveResponse.data.id;

    if (!documentId) {
      throw new Error("Failed to create document");
    }

    const docs = google.docs({ version: "v1", auth: oauth2Client });

    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
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

    if (error.code === 403 && error.errors?.length) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "No permission."}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to upload script",
        details: error.message,
        message: "An error occurred while uploading your script to Google Drive",
      },
      { status: 500 }
    );
  }
}
