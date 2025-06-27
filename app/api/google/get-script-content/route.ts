
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
    
    // Extract both plain text and HTML content with formatting from the document
    let content = '';
    let htmlContent = '';
    
    if (doc.body && doc.body.content) {
      for (const element of doc.body.content) {
        if (element.paragraph) {
          const paragraph = element.paragraph;
          if (paragraph.elements) {
            let paragraphText = '';
            let paragraphHtml = '';
            
            for (const elem of paragraph.elements) {
              if (elem.textRun && elem.textRun.content) {
                const text = elem.textRun.content;
                paragraphText += text;
                
                // Extract font size from text style
                let htmlElement = text;
                if (elem.textRun.textStyle) {
                  const style = elem.textRun.textStyle;
                  const cssStyles = [];
                  
                  // Handle font size
                  if (style.fontSize && style.fontSize.magnitude) {
                    cssStyles.push(`font-size: ${style.fontSize.magnitude}pt`);
                  }
                  
                  // Handle bold
                  if (style.bold) {
                    cssStyles.push('font-weight: bold');
                  }
                  
                  // Handle italic
                  if (style.italic) {
                    cssStyles.push('font-style: italic');
                  }
                  
                  // Handle underline
                  if (style.underline) {
                    cssStyles.push('text-decoration: underline');
                  }
                  
                  // Handle font family
                  if (style.weightedFontFamily && style.weightedFontFamily.fontFamily) {
                    cssStyles.push(`font-family: "${style.weightedFontFamily.fontFamily}"`);
                  }
                  
                  // Handle text color
                  if (style.foregroundColor && style.foregroundColor.color) {
                    const color = style.foregroundColor.color;
                    if (color.rgbColor) {
                      const r = Math.round((color.rgbColor.red || 0) * 255);
                      const g = Math.round((color.rgbColor.green || 0) * 255);
                      const b = Math.round((color.rgbColor.blue || 0) * 255);
                      cssStyles.push(`color: rgb(${r}, ${g}, ${b})`);
                    }
                  }
                  
                  if (cssStyles.length > 0) {
                    htmlElement = `<span style="${cssStyles.join('; ')}">${text}</span>`;
                  }
                }
                
                paragraphHtml += htmlElement;
              }
            }
            
            content += paragraphText;
            
            // Wrap paragraph in appropriate HTML element
            if (paragraphHtml.trim()) {
              // Check paragraph style for heading levels
              const paragraphStyle = paragraph.paragraphStyle;
              if (paragraphStyle && paragraphStyle.namedStyleType) {
                const styleType = paragraphStyle.namedStyleType;
                if (styleType.includes('HEADING_')) {
                  const level = styleType.replace('HEADING_', '');
                  htmlContent += `<h${level}>${paragraphHtml}</h${level}>`;
                } else {
                  htmlContent += `<p>${paragraphHtml}</p>`;
                }
              } else {
                htmlContent += `<p>${paragraphHtml}</p>`;
              }
            } else {
              htmlContent += '<p><br></p>'; // Empty paragraph
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      content: content,
      htmlContent: htmlContent,
      title: doc.title 
    });

  } catch (error: unknown) {
    console.error("Error fetching document content:", error);

    // Handle Google API permission errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 403 && 'errors' in error && Array.isArray(error.errors) && error.errors.length > 0) {
      const firstError = error.errors[0] as { message?: string };
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${firstError.message || "The authenticated Google account does not have permission to access this document."}`,
        },
        { status: 403 }
      );
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch document content", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
