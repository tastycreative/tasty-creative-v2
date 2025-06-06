/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

interface FolderMapping {
  [key: string]: {
    [key: string]: string;
  };
}

interface DriveFile {
  id: string | null | undefined;
  name: string | null | undefined;
  mimeType: string | null | undefined;
  webViewLink: string | null | undefined;
  thumbnailLink: string | null | undefined;
}

export async function GET(request: NextRequest) {
  try {
    // Authentication with auth.js
    const session = await auth();
    if (!session?.user || !session.accessToken) {
      console.log("Authentication error: No valid session or access token found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse search parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams?.get("type");
    const flyer = searchParams?.get("flyer");

    console.log("Request params - type:", type, "flyer:", flyer);

    // Get folder ID based on parameters
    const folderId = getFolderIdByType(type, flyer);
    if (!folderId) {
      return NextResponse.json(
        { error: "Invalid type or flyer parameter combination" },
        { status: 400 }
      );
    }

    console.log("Using folder ID:", folderId);

    // Set up Google OAuth2 client
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

    // Fetch files from the specified folder
    const files = await getDriveFiles(drive, folderId);
    console.log(`Found ${files.length} files in folder`);

    return NextResponse.json({ files });

  } catch (error: any) {
    console.error("Google Drive API error:", error);
    
    // Handle specific Google API errors
    if (error.code === 403 && error.errors?.length > 0) {
      console.error("Google API Permission Error (403):", error.errors[0].message);
      return NextResponse.json({
        error: "GooglePermissionDenied",
        message: `Google API Error: ${error.errors[0].message || 'Insufficient permissions for Google Drive access.'}`
      }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch drive items" },
      { status: 500 }
    );
  }
}

function getFolderIdByType(type: string | null, flyer: string | null): string | null {
  // Handle LIVE type (no flyer needed)
  if (type === "LIVE") {
    return "1ykoRn82LsLjah0CXG346LInKV6rk03Ji";
  }

  // Handle flyer-based types
  if (!flyer || !type) {
    return null;
  }

  const folderMappings: FolderMapping = {
    VIP: {
      BOTTOM: "1LRY3Yv6yw2QeYqxY1tAVqcZW-Awa5FAD",
      LEFT: "1G-kCkeG2XyL-elcC7T-U7CVIV6rGWOIN",
      RIGHT: "1ydbCAULvx05RdkRSzhU8FzTi0wbJ9ddv",
    },
    FTT: {
      BOTTOM: "1lXS8rPmnpOxcF_MA82OqGpgHl_Ow9del",
      LEFT: "10UXhF78k-zfgLCy_G-TWeagOOPWLSieQ",
      RIGHT: "1p_U7XP3F2EMWMDtPc8pTC-8TDPhb_WaI",
    },
  };

  return folderMappings[flyer]?.[type] || null;
}

async function getDriveFiles(drive: any, folderId: string): Promise<DriveFile[]> {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, webViewLink, thumbnailLink)",
    pageSize: 1000, // Add page size for better performance
    orderBy: "name", // Add ordering for consistent results
  });

  return response.data.files || [];
}