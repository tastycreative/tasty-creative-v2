/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

interface DriveFile {
  id: string;
  name: string;
  isFolder: boolean;
  isVideo: boolean;
  size: number | null;
  createdAt: string | null | undefined;
  modifiedAt: string | null | undefined;
  mimeType: string | null | undefined;
  webViewLink: string | null | undefined;
  thumbnailLink: string | null | undefined;
  parents: string[] | undefined;
}

interface FolderInfo {
  id: string | null | undefined;
  name: string | null | undefined;
  mimeType: string | null | undefined;
  parents: string[] | undefined;
  createdAt: string | null | undefined;
  modifiedAt: string | null | undefined;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Received request:", request.nextUrl.toString());

    // Authentication with auth.js
    const session = await auth();
    if (!session?.user || !session.accessToken) {
      console.log(
        "Authentication error: No valid session or access token found."
      );
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse search parameters
    const searchParams = request.nextUrl.searchParams;
    const folderId =
      searchParams?.get("folderId") || process.env.GOOGLE_DRIVE_BASE_FOLDER_ID!;
    let modelName = searchParams?.get("folderName");
    const includeVideos = searchParams?.get("includeVideos") === "true";

    // Handle special case for Victoria (V)
    if (modelName === "Victoria (V)") {
      modelName = "V";
    }

    console.log(
      "Search Params - folderId:",
      folderId,
      "modelName:",
      modelName,
      "includeVideos:",
      includeVideos
    );

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

    console.log("OAuth2 client set up successfully.");
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Get current folder details
    const currentFolder = await getCurrentFolderDetails(drive, folderId);
    console.log("Current folder details:", currentFolder);

    // Find target folder (navigate through folder hierarchy if needed)
    const targetFolder = await findTargetFolder(
      drive,
      currentFolder,
      modelName,
      folderId
    );
    console.log("Target folder details:", targetFolder);

    // Get files from target folder
    const files = await getFilesFromFolder(
      drive,
      targetFolder.id!,
      includeVideos
    );
    console.log("Files in folder:", files);

    return NextResponse.json({
      files,
      currentFolder: {
        id: currentFolder.id,
        name: currentFolder.name,
        parents: currentFolder.parents,
      },
      parentFolder: targetFolder.parents?.[0]
        ? {
            id: targetFolder.parents[0],
            name: "Parent Folder",
          }
        : null,
    });
  } catch (error: any) {
    console.error("Google Drive API Error:", error);

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
        error: "Failed to retrieve files",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function getCurrentFolderDetails(
  drive: any,
  folderId: string
): Promise<FolderInfo> {
  const response = await drive.files.get({
    fileId: folderId,
    fields: "id, name, parents, mimeType, createdTime, modifiedTime",
    supportsAllDrives: true,
  });

  return {
    id: response.data.id,
    name: response.data.name,
    mimeType: response.data.mimeType,
    parents: response.data.parents,
    createdAt: response.data.createdTime,
    modifiedAt: response.data.modifiedTime,
  };
}

async function findTargetFolder(
  drive: any,
  currentFolder: FolderInfo,
  modelName: string | null,
  folderId: string
): Promise<FolderInfo> {
  let targetFolder = currentFolder;

  if (!modelName || modelName === currentFolder.name) {
    return targetFolder;
  }

  console.log(
    `Searching for folder "${modelName}" inside "${currentFolder.name}"`
  );

  // Search for model folder
  const searchResponse = await drive.files.list({
    q: `name = '${modelName}' and '${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
    spaces: "drive",
    fields: "files(id, name, parents, mimeType)",
    pageSize: 10,
    corpora: "user",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const matchingFolders = searchResponse.data.files || [];
  console.log("Matching folders found:", matchingFolders);

  if (matchingFolders.length === 0) {
    throw new Error(
      `No folder found matching "${modelName}" in current folder`
    );
  }

  targetFolder = {
    id: matchingFolders[0].id,
    name: matchingFolders[0].name,
    mimeType: matchingFolders[0].mimeType,
    parents: matchingFolders[0].parents,
    createdAt: null,
    modifiedAt: null,
  };

  // Check for "Vault New - ${modelName}" folder
  targetFolder = await navigateToVaultNew(drive, targetFolder, modelName);

  return targetFolder;
}

async function navigateToVaultNew(
  drive: any,
  folder: FolderInfo,
  modelName: string
): Promise<FolderInfo> {
  const vaultNewSearchResponse = await drive.files.list({
    q: `name = 'Vault New - ${modelName}' and '${folder.id}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
    spaces: "drive",
    fields: "files(id, name, parents, mimeType)",
    pageSize: 1,
    corpora: "user",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const vaultNewFolder = vaultNewSearchResponse.data.files?.[0];
  if (!vaultNewFolder) {
    return folder;
  }

  console.log(`Automatically navigating to Vault New - ${modelName}`);
  let targetFolder: FolderInfo = {
    id: vaultNewFolder.id,
    name: vaultNewFolder.name,
    mimeType: vaultNewFolder.mimeType,
    parents: vaultNewFolder.parents,
    createdAt: null,
    modifiedAt: null,
  };

  // Check for "Wall Posts" folder
  const wallPostsSearchResponse = await drive.files.list({
    q: `name = 'Wall Posts' and '${targetFolder.id}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
    spaces: "drive",
    fields: "files(id, name, parents, mimeType)",
    pageSize: 1,
    corpora: "user",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const wallPostsFolder = wallPostsSearchResponse.data.files?.[0];
  if (wallPostsFolder) {
    console.log("Automatically navigating to Wall Posts");
    targetFolder = {
      id: wallPostsFolder.id,
      name: wallPostsFolder.name,
      mimeType: wallPostsFolder.mimeType,
      parents: wallPostsFolder.parents,
      createdAt: null,
      modifiedAt: null,
    };
  }

  return targetFolder;
}

async function getFilesFromFolder(
  drive: any,
  folderId: string,
  includeVideos: boolean
): Promise<DriveFile[]> {
  // Build query for listing files
  let fileQuery = `'${folderId}' in parents`;
  let typeQuery = `(mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'image/')`;

  if (includeVideos) {
    const videoTypes = [
      "video/quicktime",
      "video/mov",
      "video/mp4",
      "video/x-m4v",
      "video/x-msvideo",
      "video/x-ms-wmv",
      "video/webm",
      "video/3gpp",
      "video/mpeg",
      "video/ogg",
    ];

    typeQuery += ` or ${videoTypes.map((type) => `mimeType = '${type}'`).join(" or ")}`;
    typeQuery += ` or (name contains '.MOV' or name contains '.mov')`;
    typeQuery += ` or mimeType contains 'video/'`;
  }

  fileQuery = `${fileQuery} and (${typeQuery})`;
  console.log("File query:", fileQuery);

  const listResponse = await drive.files.list({
    q: fileQuery,
    spaces: "drive",
    fields:
      "files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, thumbnailLink)",
    pageSize: 1000,
    corpora: "user",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    orderBy: "folder,name",
  });

  return (listResponse.data.files || []).map(
    (file: {
      mimeType: string | string[];
      name: string;
      id: string;
      size: string;
      createdTime: any;
      modifiedTime: any;
      webViewLink: any;
      thumbnailLink: any;
      parents: any;
    }): DriveFile => {
      const videoExtensions = [
        ".mov",
        ".mp4",
        ".avi",
        ".wmv",
        ".webm",
        ".mpeg",
        ".mpg",
        ".3gp",
      ];
      const isVideo =
        file.mimeType?.includes("video/") ||
        videoExtensions.some((ext) => file.name?.toLowerCase().endsWith(ext)) ||
        false;

      return {
        id: file.id!,
        name: file.name!,
        isFolder: file.mimeType === "application/vnd.google-apps.folder",
        isVideo,
        size: file.size ? parseInt(file.size) : null,
        createdAt: file.createdTime,
        modifiedAt: file.modifiedTime,
        mimeType: Array.isArray(file.mimeType) ? file.mimeType[0] : file.mimeType,
        webViewLink: file.webViewLink,
        thumbnailLink: file.thumbnailLink,
        parents: file.parents,
      };
    }
  );
}
