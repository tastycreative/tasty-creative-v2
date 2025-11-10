import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

// Helper function to extract sheet ID from Google Sheets URL
function extractSheetId(url: string): string | null {
  if (!url) return null;

  // Already an ID
  if (!url.includes("/") && !url.includes("http")) {
    return url;
  }

  // Extract from various Google Sheets URL formats
  const patterns = [
    /spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Helper function to extract folder ID from Google Drive URL or return the ID itself
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { modelId } = await params;
    
    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    // Find the client model
    const clientModel = await prisma.clientModel.findUnique({
      where: {
        clientName: decodeURIComponent(modelId),
      },
      select: {
        id: true,
      },
    });

    if (!clientModel) {
      return NextResponse.json(
        { error: "Model not found" },
        { status: 404 }
      );
    }

    // Fetch sheet links for this model
    const sheetLinks = await prisma.clientModelSheetLinks.findMany({
      where: {
        clientModelId: clientModel.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(sheetLinks);
  } catch (error) {
    console.error("Error fetching sheet links:", error);
    return NextResponse.json(
      { error: "Failed to fetch sheet links" },
      { status: 500 }
    );
  }
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check for token refresh errors
    if ((session as any).error === "RefreshAccessTokenError") {
      return NextResponse.json(
        { 
          error: "Your Google Drive access has expired. Please sign out and sign in again to reconnect." 
        },
        { status: 401 }
      );
    }

    if (!session?.accessToken || !session?.refreshToken) {
      return NextResponse.json(
        { 
          error: "No Google Drive access. Please sign out and sign in again to grant Google Drive permissions." 
        },
        { status: 401 }
      );
    }

    // Check if user is admin or moderator
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { modelId } = await params;
    
    if (!modelId) {
      return NextResponse.json(
        { error: "Model name is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { sheetUrl, sheetType, subType, generateNew } = body;

    console.log('Received sheet link request:', { sheetUrl, sheetType, subType, generateNew });

    if (!sheetUrl) {
      return NextResponse.json(
        { error: "Sheet URL is required" },
        { status: 400 }
      );
    }

    const validSheetTypes = ['Caption Bank', 'Scheduler'];
    
    if (!sheetType || !validSheetTypes.includes(sheetType)) {
      console.error('Invalid sheet type received:', sheetType, 'Expected one of:', validSheetTypes);
      return NextResponse.json(
        { error: `Invalid sheet type: "${sheetType}". Expected one of: ${validSheetTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate subType for Scheduler sheets
    if (sheetType === 'Scheduler' && subType && !['FREE', 'PAID', 'OFTV'].includes(subType)) {
      return NextResponse.json(
        { error: `Invalid subType: "${subType}". Expected one of: FREE, PAID, OFTV` },
        { status: 400 }
      );
    }

    // Find the client model with launchesPodFolderId
    const clientModel = await prisma.clientModel.findUnique({
      where: {
        clientName: decodeURIComponent(modelId),
      },
    });

    if (!clientModel) {
      return NextResponse.json(
        { error: "Model not found" },
        { status: 404 }
      );
    }

    // Setup Google Drive and Sheets APIs
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
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // Extract sheet ID from URL
    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      return NextResponse.json(
        { error: "Invalid sheet URL" },
        { status: 400 }
      );
    }

    // Get sheet details from Google Sheets API
    let sheetName = "";
    try {
      const sheetMetadata = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });
      sheetName = sheetMetadata.data.properties?.title || "Untitled Sheet";
    } catch (error: any) {
      console.error("Error fetching sheet metadata:", error);
      return NextResponse.json(
        { error: "Failed to fetch sheet details. Make sure the sheet is accessible." },
        { status: 400 }
      );
    }

    let targetFolderId: string | null = null;
    let targetFolderName: string | null = null;

    // Only process Scheduler sheets with subType
    if (sheetType === 'Scheduler' && subType) {
      // Check if model has launchesPodFolderId
      if (!clientModel.launchesPodFolderId) {
        return NextResponse.json(
          { error: "Model does not have a launches pod folder configured" },
          { status: 400 }
        );
      }

      const launchesFolderId = extractFolderId(clientModel.launchesPodFolderId);
      if (!launchesFolderId) {
        return NextResponse.json(
          { error: "Invalid launches pod folder ID" },
          { status: 400 }
        );
      }

      // Use the subType directly as the folder name (FREE, PAID, or OFTV)
      const targetFolderType = subType;

      // Search for existing folder with the target name
      try {
        const folderSearchResponse = await drive.files.list({
          q: `name='${targetFolderType}' and '${launchesFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        if (folderSearchResponse.data.files && folderSearchResponse.data.files.length > 0) {
          // Folder exists, use it
          targetFolderId = folderSearchResponse.data.files[0].id || null;
          targetFolderName = folderSearchResponse.data.files[0].name || targetFolderType;
          console.log(`✅ Found existing folder: ${targetFolderName} (${targetFolderId})`);
        } else {
          // Folder doesn't exist, create it
          const folderMetadata = {
            name: targetFolderType,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [launchesFolderId],
          };

          const folder = await drive.files.create({
            requestBody: folderMetadata,
            fields: 'id, name',
            supportsAllDrives: true,
          });

          targetFolderId = folder.data.id || null;
          targetFolderName = folder.data.name || targetFolderType;
          console.log(`✅ Created new folder: ${targetFolderName} (${targetFolderId})`);
        }
      } catch (error: any) {
        console.error("Error searching/creating folder:", error);
        return NextResponse.json(
          { error: "Failed to search or create target folder in Google Drive" },
          { status: 500 }
        );
      }

      // Move the sheet to the target folder
      if (targetFolderId) {
        try {
          // Get current parents
          const file = await drive.files.get({
            fileId: sheetId,
            fields: "parents",
            supportsAllDrives: true,
          });

          const previousParents = file.data.parents?.join(",") || "";

          // Move sheet to target folder
          await drive.files.update({
            fileId: sheetId,
            addParents: targetFolderId,
            removeParents: previousParents,
            fields: "id, parents",
            supportsAllDrives: true,
          });

          console.log(`✅ Sheet moved to folder: ${targetFolderName} (${targetFolderId})`);
        } catch (error: any) {
          console.error("Error moving sheet:", error);
          return NextResponse.json(
            { error: "Failed to move sheet to target folder. You may not have permission." },
            { status: 403 }
          );
        }
      }
    }

    // Create the sheet link in database
    const newSheetLink = await prisma.clientModelSheetLinks.create({
      data: {
        clientModelId: clientModel.id,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
        sheetName,
        sheetType,
        folderName: targetFolderName,
        folderId: targetFolderId,
      },
    });

    return NextResponse.json({
      ...newSheetLink,
      message: targetFolderId 
        ? `Sheet "${sheetName}" successfully linked and moved to ${targetFolderName} folder` 
        : `Sheet "${sheetName}" successfully linked`,
    });
  } catch (error: any) {
    console.error("Error creating sheet link:", error);

    // Handle specific Google Drive/Sheets errors
    if (error.code === 403) {
      return NextResponse.json(
        { error: "Permission denied. You may not have access to this sheet or folder." },
        { status: 403 }
      );
    }

    if (error.code === 404) {
      return NextResponse.json(
        { error: "Sheet or folder not found. The link may be invalid." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create sheet link" },
      { status: 500 }
    );
  }
}
