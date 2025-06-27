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
    const { title, content, htmlContent, preserveFormatting } = body;

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

    // Process HTML content to extract formatting and convert to Google Docs format
    let requests = [];
    
    if (htmlContent && preserveFormatting) {
      // Parse HTML content and create Google Docs requests
      const tempDiv = document.createElement ? document.createElement('div') : null;
      if (tempDiv) {
        tempDiv.innerHTML = htmlContent;
        
        // Extract text and formatting information
        const textNodes = [];
        const walkTextNodes = (node, startIndex = 1) => {
          if (node.nodeType === 3) { // Text node
            const text = node.textContent || '';
            if (text.trim()) {
              textNodes.push({
                text: text,
                startIndex: startIndex,
                endIndex: startIndex + text.length,
                formatting: getParentFormatting(node.parentElement)
              });
            }
            return text.length;
          } else if (node.nodeType === 1) { // Element node
            let length = 0;
            for (const child of node.childNodes) {
              length += walkTextNodes(child, startIndex + length);
            }
            return length;
          }
          return 0;
        };
        
        const getParentFormatting = (element) => {
          const formatting = {};
          if (element) {
            const style = element.style || {};
            if (style.fontWeight === 'bold' || element.tagName === 'B' || element.tagName === 'STRONG') {
              formatting.bold = true;
            }
            if (style.fontStyle === 'italic' || element.tagName === 'I' || element.tagName === 'EM') {
              formatting.italic = true;
            }
            if (style.textDecoration === 'underline' || element.tagName === 'U') {
              formatting.underline = true;
            }
            if (style.fontSize) {
              const fontSizeMatch = style.fontSize.match(/(\d+)pt/);
              if (fontSizeMatch) {
                formatting.fontSize = parseInt(fontSizeMatch[1]);
              }
            }
          }
          return formatting;
        };
        
        walkTextNodes(tempDiv);
        
        // Insert text first
        requests.push({
          insertText: {
            location: { index: 1 },
            text: content,
          },
        });
        
        // Apply formatting
        for (const textNode of textNodes) {
          if (Object.keys(textNode.formatting).length > 0) {
            const textStyle = {};
            
            if (textNode.formatting.bold) {
              textStyle.bold = true;
            }
            if (textNode.formatting.italic) {
              textStyle.italic = true;
            }
            if (textNode.formatting.underline) {
              textStyle.underline = true;
            }
            if (textNode.formatting.fontSize) {
              textStyle.fontSize = {
                magnitude: textNode.formatting.fontSize,
                unit: 'PT'
              };
            }
            
            if (Object.keys(textStyle).length > 0) {
              requests.push({
                updateTextStyle: {
                  range: {
                    startIndex: textNode.startIndex,
                    endIndex: textNode.endIndex,
                  },
                  textStyle: textStyle,
                  fields: Object.keys(textStyle).join(',')
                },
              });
            }
          }
        }
      } else {
        // Fallback for server-side processing
        requests.push({
          insertText: {
            location: { index: 1 },
            text: content,
          },
        });
      }
    } else {
      // Simple text insertion without formatting
      requests.push({
        insertText: {
          location: { index: 1 },
          text: content,
        },
      });
    }

    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: requests,
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