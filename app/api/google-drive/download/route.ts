/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import heicConvert from "heic-convert";

export const dynamic = "force-dynamic";

interface FileMetadata {
  id: string | null | undefined;
  name: string | null | undefined;
  mimeType: string | null | undefined;
  size: string | null | undefined;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams?.get("id");
    const skipConversion = searchParams?.get("skipConversion") === "true";

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Authentication with auth.js
    const session = await auth();
    if (!session?.user || !session.accessToken) {
      //console.log("Authentication error: No valid session or access token found.");
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
    //console.log(`Processing file: ${fileMeta.name}, Type: ${fileMeta.mimeType}, Size: ${fileMeta.size}`);

    const mimeType = fileMeta.mimeType || "application/octet-stream";
    const fileName = fileMeta.name || "file";

    // Determine file type and processing strategy
    const fileType = determineFileType(mimeType, fileName);

    // Handle different file types
    switch (fileType.category) {
      case "video":
        return await streamVideoFile(drive, fileId, mimeType, fileName);

      case "heic":
        if (skipConversion) {
          return await streamFile(
            drive,
            fileId,
            mimeType,
            fileName,
            "attachment"
          );
        }
        return await convertAndDownloadHEIC(drive, fileId, fileName);

      case "image":
      default:
        if (skipConversion) {
          const dispositionType =
            fileType.category === "image" ? "inline" : "attachment";
          return await streamFile(
            drive,
            fileId,
            mimeType,
            fileName,
            dispositionType
          );
        }
        return await streamFile(
          drive,
          fileId,
          mimeType,
          fileName,
          "attachment"
        );
    }
  } catch (error: any) {
    console.error("API error:", error);

    // Handle specific Google API errors
    if (error.code === 403 && error.errors?.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "Insufficient permissions for Google Drive access."}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
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

interface FileTypeInfo {
  category: "video" | "heic" | "image" | "other";
  isVideo: boolean;
  isHEIC: boolean;
}

function determineFileType(mimeType: string, fileName: string): FileTypeInfo {
  const isHEIC = mimeType === "image/heic" || mimeType === "image/heif";

  const videoExtensions = [".mov", ".mp4", ".avi", ".wmv"];
  const isVideo =
    mimeType.startsWith("video/") ||
    videoExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));

  let category: FileTypeInfo["category"] = "other";
  if (isVideo) category = "video";
  else if (isHEIC) category = "heic";
  else if (mimeType.startsWith("image/")) category = "image";

  return { category, isVideo, isHEIC };
}

async function streamVideoFile(
  drive: any,
  fileId: string,
  mimeType: string,
  fileName: string
): Promise<NextResponse> {
  //console.log(`Streaming video file: ${fileName} (${mimeType})`);

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  return new NextResponse(response.data as any, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
      "Accept-Ranges": "bytes",
    },
  });
}

async function streamFile(
  drive: any,
  fileId: string,
  mimeType: string,
  fileName: string,
  dispositionType: "inline" | "attachment"
): Promise<NextResponse> {
  //console.log(`Streaming file: ${fileName} (${mimeType})`);

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  return new NextResponse(response.data as any, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${dispositionType}; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}

async function convertAndDownloadHEIC(
  drive: any,
  fileId: string,
  fileName: string
): Promise<NextResponse> {
  //console.log(`Converting HEIC image: ${fileName}`);

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  // Collect stream data into buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.data) {
    chunks.push(chunk);
  }

  const inputBuffer = Buffer.concat(chunks);

  // Convert HEIC to JPEG
  const outputBuffer = await heicConvert({
    buffer: inputBuffer as unknown as ArrayBuffer,
    format: "JPEG",
    quality: 0.9,
  });

  const newFileName = fileName.replace(/\.\w+$/, ".jpg");
  //console.log(`Converted to JPEG: ${newFileName}`);

  return new NextResponse(outputBuffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(newFileName)}"`,
    },
  });
}
