import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

// Helper function to extract folder ID from Google Drive URL
function extractFolderId(url: string): string | null {
  if (!url) return null;

  // Already an ID
  if (!url.includes("/") && !url.includes("http")) {
    return url;
  }

  // Extract from various Google Drive URL formats
  const patterns = [
    /folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /[-\w]{25,}/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check for token refresh errors
    if ((session as any).error === "RefreshAccessTokenError") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your Google Drive access has expired. Please sign out and sign in again to reconnect.",
        },
        { status: 401 }
      );
    }

    if (!session?.accessToken || !session?.refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No Google Drive access. Please sign out and sign in again to grant Google Drive permissions.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Get the task with OFTV data
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        oftvTask: true,
      },
    });

    if (!task || !task.oftvTask) {
      return NextResponse.json(
        { success: false, error: "OFTV task not found" },
        { status: 404 }
      );
    }

    const folderLink = task.oftvTask.folderLink;
    const modelName = task.oftvTask.model;

    if (!folderLink) {
      return NextResponse.json(
        { success: false, error: "No folder link found on OFTV task" },
        { status: 400 }
      );
    }

    if (!modelName) {
      return NextResponse.json(
        { success: false, error: "No model name found on OFTV task" },
        { status: 400 }
      );
    }

    // Get the client model's OFTV gallery using the model name from the task
    const clientModel = await prisma.clientModel.findUnique({
      where: { clientName: modelName },
      include: {
        oftvGallery: true,
      },
    });

    if (!clientModel) {
      return NextResponse.json(
        {
          success: false,
          error: `Client model "${modelName}" not found`,
        },
        { status: 404 }
      );
    }

    const oftvGallery = clientModel.oftvGallery;

    if (!oftvGallery?.publishedFolderLink) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No published folder link found for this client model. Please set up the OFTV gallery first.",
        },
        { status: 400 }
      );
    }

    // Extract folder IDs
    const sourceFolderId = extractFolderId(folderLink);
    const destinationFolderId = extractFolderId(
      oftvGallery.publishedFolderLink
    );

    if (!sourceFolderId) {
      return NextResponse.json(
        { success: false, error: "Invalid source folder link" },
        { status: 400 }
      );
    }

    if (!destinationFolderId) {
      return NextResponse.json(
        { success: false, error: "Invalid destination folder link" },
        { status: 400 }
      );
    }

    // Setup Google Drive API with user's OAuth token
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

    // Move the folder by updating its parent
    // First, get current parents to remove them
    const file = await drive.files.get({
      fileId: sourceFolderId,
      fields: "parents",
      supportsAllDrives: true,
    });

    const previousParents = file.data.parents?.join(",") || "";

    // Move folder to new parent (published folder)
    await drive.files.update({
      fileId: sourceFolderId,
      addParents: destinationFolderId,
      removeParents: previousParents,
      fields: "id, parents",
      supportsAllDrives: true,
    });

    console.log(
      `✅ Folder moved: ${sourceFolderId} -> Published folder: ${destinationFolderId}`
    );

    return NextResponse.json({
      success: true,
      message: "Folder moved to published location",
      sourceFolderId,
      destinationFolderId,
    });
  } catch (error: any) {
    console.error("Error moving folder to published:", error);

    // Handle specific Google Drive errors
    if (error.code === 403) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Permission denied. You may not have access to move this folder.",
        },
        { status: 403 }
      );
    }

    if (error.code === 404) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Folder not found. The folder link may be invalid or the folder may have been deleted.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to move folder to published location",
      },
      { status: 500 }
    );
  }
}
