
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');

    if (!docId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
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

    const docs = google.docs({ version: "v1", auth: oauth2Client });

    // Get the document content
    const response = await docs.documents.get({
      documentId: docId,
    });

    const doc = response.data;
    
    // Extract text content from the document
    let content = '';
    if (doc.body && doc.body.content) {
      for (const element of doc.body.content) {
        if (element.paragraph) {
          const paragraph = element.paragraph;
          if (paragraph.elements) {
            for (const elem of paragraph.elements) {
              if (elem.textRun && elem.textRun.content) {
                content += elem.textRun.content;
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      content: content,
      title: doc.title 
    });

  } catch (error: any) {
    console.error("Error fetching document content:", error);

    // Handle Google API permission errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission to access this document."}`,
        },
        { status: 403 }
      );
    }

    if (error.code === 404) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch document content", details: error.message },
      { status: 500 }
    );
  }
}
