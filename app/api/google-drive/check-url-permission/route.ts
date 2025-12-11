import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

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
          message: "No access token available. Please sign in with Google."
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
      // Also handles: https://drive.google.com/drive/u/0/folders/ID
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

    const fileId = extractIdFromUrl(driveUrl);
    console.log(`Extracted file ID: ${fileId} from URL: ${driveUrl}`);

    if (!fileId) {
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

    // Try to access the file/folder to check permissions
    // For Shared Drives, we need to include supportsAllDrives
    try {
      const fileResponse = await drive.files.get({
        fileId: fileId,
        fields: "id, name, mimeType, capabilities, driveId, owners, permissionIds",
        supportsAllDrives: true,
      });

      const file = fileResponse.data;

      console.log(`File metadata retrieved:`, {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        driveId: file.driveId,
        hasCapabilities: !!file.capabilities,
        canDownload: file.capabilities?.canDownload,
        canListChildren: file.capabilities?.canListChildren,
        hasOwners: !!file.owners,
        hasPermissionIds: !!file.permissionIds
      });

      // For Shared Drives, if we successfully retrieved the file, the user has access
      // capabilities might not be present or might be false for Shared Drive items
      // The fact that we got here without a 403/404 means the user has access
      const hasAccess = file.id && file.name;
      
      if (!hasAccess) {
        console.log(`Unable to verify access for file/folder: ${fileId}`);
        return NextResponse.json(
          {
            error: "GooglePermissionDenied",
            message: "You don't have permission to access this file/folder. Please request access from the owner."
          },
          { status: 403 }
        );
      }

      console.log(`✅ Access verified successfully for: ${file.name} (${fileId})`);

      // Return success with file info
      return NextResponse.json({
        success: true,
        message: "Access verified successfully",
        file: {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          isFolder: file.mimeType === "application/vnd.google-apps.folder",
          canDownload: file.capabilities?.canDownload ?? true, // Assume true if capabilities not present
          canEdit: file.capabilities?.canEdit,
          isSharedDrive: !!file.driveId,
        }
      });

    } catch (driveError: any) {
      // Log detailed error information
      console.error("Drive API error details:", {
        code: driveError.code,
        message: driveError.message,
        errors: driveError.errors,
        fileId: fileId
      });

      // Handle specific Drive API errors
      if (driveError.code === 404) {
        return NextResponse.json(
          {
            error: "NotFound",
            message: "File or folder not found. Check the URL or request access from the owner."
          },
          { status: 404 }
        );
      }

      if (driveError.code === 403) {
        // Check if this is an OAuth scope issue vs file permission issue
        const errorMessage = driveError.message || '';
        const isOAuthError = errorMessage.toLowerCase().includes('insufficient') ||
                            errorMessage.toLowerCase().includes('scope');

        return NextResponse.json(
          {
            error: "GooglePermissionDenied",
            message: isOAuthError
              ? "Missing required Google permissions. Please re-authenticate."
              : "You don't have permission to access this file/folder. Please request access from the owner.",
            isOAuthError: isOAuthError
          },
          { status: 403 }
        );
      }

      throw driveError;
    }

  } catch (error) {
    console.error("Google Drive permission check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check permissions",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
