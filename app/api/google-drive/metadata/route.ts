import { google } from "googleapis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

interface FileMetadata {
  id: string | null | undefined;
  name: string | null | undefined;
  mimeType: string | null | undefined;
  size: string | null | undefined;
}

async function getFileMetadata(
  drive: any,
  fileId: string
): Promise<FileMetadata> {
  const { data } = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,size",
    supportsAllDrives: true,
  });

  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    size: data.size,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams?.get("id");

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Authentication with auth.js
    const session = await auth();
    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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

    // Get file metadata
    const fileMeta = await getFileMetadata(drive, fileId);

    return NextResponse.json({
      id: fileMeta.id,
      name: fileMeta.name,
      mimeType: fileMeta.mimeType,
      size: fileMeta.size ? parseInt(fileMeta.size) : null,
    });

  } catch (error: any) {
    console.error("Error fetching file metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch file metadata", details: error.message },
      { status: 500 }
    );
  }
}