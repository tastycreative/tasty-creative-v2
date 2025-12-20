import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

/**
 * Fetches an authenticated thumbnail from Google Drive
 * Uses the user's OAuth token to access the file
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: "No access token available. Please sign in with Google.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const size = searchParams.get("size") || "2000"; // Default size

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID required" },
        { status: 400 }
      );
    }

    console.log(`Fetching authenticated thumbnail for file: ${fileId}`);

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Get the thumbnail link from file metadata
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: "thumbnailLink, mimeType, name",
      supportsAllDrives: true,
    });

    let thumbnailUrl = fileMetadata.data.thumbnailLink;

    if (!thumbnailUrl) {
      // If no thumbnail available, use the file content directly for images
      if (fileMetadata.data.mimeType?.includes('image/')) {
        console.log(`No thumbnail available, using file content directly`);

        const fileResponse = await drive.files.get(
          {
            fileId: fileId,
            alt: 'media',
            supportsAllDrives: true,
          },
          { responseType: 'stream' }
        );

        // Stream the file content
        const headers = new Headers({
          'Content-Type': fileMetadata.data.mimeType || 'image/jpeg',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Access-Control-Allow-Origin': '*',
        });

        return new NextResponse(fileResponse.data as any, { headers });
      } else {
        return NextResponse.json(
          { error: "No thumbnail available for this file" },
          { status: 404 }
        );
      }
    }

    // Replace size parameter in thumbnail URL if needed
    if (size && size !== "s220") {
      thumbnailUrl = thumbnailUrl.replace(/=s\d+/, `=s${size}`);
    }

    console.log(`Fetching thumbnail from: ${thumbnailUrl}`);

    // Fetch the thumbnail using the authenticated session
    const thumbnailResponse = await fetch(thumbnailUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!thumbnailResponse.ok) {
      console.error(`Failed to fetch thumbnail: ${thumbnailResponse.status}`);

      // Fallback to direct file download for images
      if (fileMetadata.data.mimeType?.includes('image/')) {
        console.log(`Falling back to direct file download`);

        const fileResponse = await drive.files.get(
          {
            fileId: fileId,
            alt: 'media',
            supportsAllDrives: true,
          },
          { responseType: 'stream' }
        );

        const headers = new Headers({
          'Content-Type': fileMetadata.data.mimeType || 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        });

        return new NextResponse(fileResponse.data as any, { headers });
      }

      throw new Error(`Thumbnail fetch failed: ${thumbnailResponse.status}`);
    }

    const contentType = thumbnailResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await thumbnailResponse.arrayBuffer();

    // Return the thumbnail with caching headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error("Google Drive thumbnail error:", error);

    // Handle specific Drive API errors
    if (error.code === 404) {
      return NextResponse.json(
        {
          error: "NotFound",
          message: "File not found or you don't have access.",
        },
        { status: 404 }
      );
    }

    if (error.code === 403) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: "You don't have permission to access this file.",
        },
        { status: 403 }
      );
    }

    // Return error placeholder SVG
    const errorSvg = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="#fef2f2"/>
        <rect x="20" y="20" width="260" height="260" fill="white" stroke="#fecaca" stroke-width="2" rx="8"/>
        <g transform="translate(150,150)">
          <circle cx="0" cy="0" r="25" fill="#dc2626" opacity="0.1"/>
          <text x="0" y="5" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#dc2626">⚠</text>
        </g>
        <text x="150" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#dc2626" font-weight="600">
          Load Error
        </text>
        <text x="150" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">
          ${error instanceof Error ? error.message : "Unknown error"}
        </text>
      </svg>
    `;

    return new NextResponse(errorSvg, {
      status: 500,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  }
}
