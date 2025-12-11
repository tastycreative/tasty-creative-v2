import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

/**
 * Fetches image files from a Google Drive folder or extracts images from a single file URL
 * Returns an array of image metadata (id, name, thumbnailLink, webViewLink)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { driveUrl } = body;

    if (!driveUrl) {
      return NextResponse.json(
        { error: "Drive URL is required" },
        { status: 400 }
      );
    }

    // Validate that it's a Google Drive URL
    const isDriveUrl = /^https?:\/\/(drive|docs)\.google\.com\/(drive|file|open)/i.test(driveUrl);

    if (!isDriveUrl) {
      return NextResponse.json(
        { error: "Invalid URL format. Please provide a valid Google Drive link." },
        { status: 400 }
      );
    }

    // Extract file/folder ID from Google Drive URL
    const extractIdFromUrl = (url: string): string | null => {
      // Match folder URL: https://drive.google.com/drive/folders/ID
      const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (folderMatch) return folderMatch[1];

      // Match file URL: https://drive.google.com/file/d/ID
      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch) return fileMatch[1];

      // Match open URL: https://drive.google.com/open?id=ID
      const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (openMatch) return openMatch[1];

      return null;
    };

    const resourceId = extractIdFromUrl(driveUrl);
    console.log(`Extracted resource ID: ${resourceId} from URL: ${driveUrl}`);

    if (!resourceId) {
      return NextResponse.json(
        { error: "Invalid Google Drive URL. Could not extract file/folder ID." },
        { status: 400 }
      );
    }

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

    // Check if the resource is a folder or file
    const resourceMetadata = await drive.files.get({
      fileId: resourceId,
      fields: "id, name, mimeType",
      supportsAllDrives: true,
    });

    const isFolder = resourceMetadata.data.mimeType === "application/vnd.google-apps.folder";
    console.log(`Resource "${resourceMetadata.data.name}" is a ${isFolder ? 'folder' : 'file'}`);

    let images: Array<{
      id: string;
      name: string;
      mimeType: string;
      thumbnailLink?: string;
      webViewLink?: string;
      size?: number;
    }> = [];

    if (isFolder) {
      // Fetch all image files from the folder
      console.log(`Fetching images from folder: ${resourceMetadata.data.name}`);

      const listResponse = await drive.files.list({
        q: `'${resourceId}' in parents and (mimeType contains 'image/')`,
        spaces: "drive",
        fields: "files(id, name, mimeType, size, thumbnailLink, webViewLink, modifiedTime)",
        pageSize: 1000, // Max allowed by API
        orderBy: "name", // Sort by name for consistent ordering
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const files = listResponse.data.files || [];
      console.log(`Found ${files.length} images in folder`);

      images = files.map((file) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        thumbnailLink: file.thumbnailLink,
        webViewLink: file.webViewLink,
        size: file.size ? parseInt(file.size) : undefined,
      }));
    } else {
      // Check if the single file is an image
      const isImage = resourceMetadata.data.mimeType?.includes('image/');

      if (!isImage) {
        return NextResponse.json(
          { error: "The provided link is not a folder and not an image file." },
          { status: 400 }
        );
      }

      console.log(`Single image file: ${resourceMetadata.data.name}`);

      // Get full metadata for the single image
      const fileMetadata = await drive.files.get({
        fileId: resourceId,
        fields: "id, name, mimeType, size, thumbnailLink, webViewLink",
        supportsAllDrives: true,
      });

      images = [{
        id: fileMetadata.data.id!,
        name: fileMetadata.data.name!,
        mimeType: fileMetadata.data.mimeType!,
        thumbnailLink: fileMetadata.data.thumbnailLink,
        webViewLink: fileMetadata.data.webViewLink,
        size: fileMetadata.data.size ? parseInt(fileMetadata.data.size) : undefined,
      }];
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No images found in the provided Google Drive location." },
        { status: 404 }
      );
    }

    console.log(`✅ Successfully fetched ${images.length} images from Google Drive`);

    return NextResponse.json({
      success: true,
      images,
      metadata: {
        resourceId,
        resourceName: resourceMetadata.data.name,
        isFolder,
        totalImages: images.length,
      },
    });

  } catch (error: any) {
    console.error("Google Drive fetch images error:", error);

    // Handle specific Drive API errors
    if (error.code === 404) {
      return NextResponse.json(
        {
          error: "NotFound",
          message: "File or folder not found. Check the URL or request access from the owner.",
        },
        { status: 404 }
      );
    }

    if (error.code === 403) {
      const errorMessage = error.message || '';
      const isOAuthError = errorMessage.toLowerCase().includes('insufficient') ||
                          errorMessage.toLowerCase().includes('scope');

      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: isOAuthError
            ? "Missing required Google permissions. Please re-authenticate."
            : "You don't have permission to access this file/folder. Please request access from the owner.",
          isOAuthError: isOAuthError,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch images from Google Drive",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
