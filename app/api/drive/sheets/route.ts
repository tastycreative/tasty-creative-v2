import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { folderId, creatorNames } = await request.json();

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    // Extract folder ID from Google Drive URL if needed
    const extractedFolderId = extractFolderId(folderId);
    if (!extractedFolderId) {
      return NextResponse.json(
        { error: "Invalid Google Drive folder URL or ID" },
        { status: 400 }
      );
    }

    // Search for Google Sheets in the specified folder
    const response = await drive.files.list({
      q: `'${extractedFolderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: "files(id, name, webViewLink, modifiedTime)",
      orderBy: "modifiedTime desc",
    });

    const allSheets = response.data.files || [];

    // Filter sheets that contain any of the creator names
    const filteredSheets = allSheets.filter((sheet) => {
      if (!creatorNames || creatorNames.length === 0) {
        return true; // If no creator names provided, return all sheets
      }

      const sheetName = sheet.name?.toLowerCase() || "";
      return creatorNames.some((creatorName: string) =>
        sheetName.includes(creatorName.toLowerCase())
      );
    });

    const formattedSheets = filteredSheets.map((sheet) => ({
      id: sheet.id,
      name: sheet.name,
      url: sheet.webViewLink,
      lastModified: sheet.modifiedTime,
    }));

    return NextResponse.json({
      success: true,
      sheets: formattedSheets,
      totalFound: allSheets.length,
      filteredCount: filteredSheets.length,
    });
  } catch (error) {
    console.error("Error fetching Google Drive sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch sheets from Google Drive" },
      { status: 500 }
    );
  }
}

function extractFolderId(input: string): string | null {
  // If it's already just an ID
  if (input.match(/^[a-zA-Z0-9_-]+$/)) {
    return input;
  }

  // Extract from Google Drive URL
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
