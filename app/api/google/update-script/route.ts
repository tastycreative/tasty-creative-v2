
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { docId, title, content, htmlContent } = body;

    if (!docId || !title || !content) {
      return NextResponse.json(
        { error: "Document ID, title, and content are required" },
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
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // First, get the current document to find the end index
    const currentDoc = await docs.documents.get({
      documentId: docId,
    });

    if (!currentDoc.data.body || !currentDoc.data.body.content) {
      throw new Error("Unable to access document content");
    }

    // Calculate the end index (excluding the final newline character)
    const endIndex = currentDoc.data.body.content.reduce((total, element) => {
      if (element.paragraph && element.paragraph.elements) {
        return total + element.paragraph.elements.reduce((elemTotal, elem) => {
          return elemTotal + (elem.textRun?.content?.length || 0);
        }, 0);
      }
      return total;
    }, 0);

    // Clear the document content and insert new content
    const requests = [
      // Delete all existing content (except the final newline)
      {
        deleteContentRange: {
          range: {
            startIndex: 1,
            endIndex: Math.max(1, endIndex - 1)
          }
        }
      },
      // Insert new content
      {
        insertText: {
          location: {
            index: 1
          },
          text: content
        }
      }
    ];

    // Update the document content
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: requests
      }
    });

    // Update the document title if it's different
    if (currentDoc.data.title !== title) {
      await drive.files.update({
        fileId: docId,
        requestBody: {
          name: title
        }
      });
    }

    // Get the updated document info
    const updatedFile = await drive.files.get({
      fileId: docId,
      fields: 'webViewLink'
    });

    return NextResponse.json({
      message: "Document updated successfully",
      docId: docId,
      webViewLink: updatedFile.data.webViewLink
    });

  } catch (error: any) {
    console.error("Error updating document:", error);

    // Handle Google API permission errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission to update this document."}`,
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
      { error: "Failed to update document", details: error.message },
      { status: 500 }
    );
  }
}
