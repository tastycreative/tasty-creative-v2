import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string | null;
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  } | null;
  createdTime: string;
  size?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    
    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    // Authenticate user session
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated. No access token." },
        { status: 401 }
      );
    }

    // Set up OAuth2 client
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

    // First, try to get folder contents directly without verifying the folder
    // Some folders may not be accessible via files.get but contents are accessible via files.list

    // First, let's verify we can access the folder itself
    let folderInfo;
    try {
      folderInfo = await drive.files.get({
        fileId: folderId,
        fields: 'id,name,mimeType,parents,shared,ownedByMe,capabilities,permissions'
      });
      console.log('Folder info:', {
        id: folderInfo.data.id,
        name: folderInfo.data.name,
        mimeType: folderInfo.data.mimeType,
        shared: folderInfo.data.shared,
        ownedByMe: folderInfo.data.ownedByMe,
        capabilities: folderInfo.data.capabilities
      });
    } catch (folderError) {
      console.log('Cannot access folder directly:', folderError);
    }

    // Get folder contents with multiple approaches
    let response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let folderFiles: any[] = [];

    // Approach 1: Standard query
    try {
      console.log('Trying approach 1: Standard query...');
      response = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType,webViewLink,thumbnailLink,videoMediaMetadata,createdTime,size,parents,shared,ownedByMe)',
        orderBy: 'createdTime desc',
        pageSize: 100,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true
      });
      folderFiles = response.data.files || [];
      console.log('Approach 1 results:', folderFiles.length, 'files');
    } catch (firstError) {
      console.log('Approach 1 failed:', firstError);
    }

    // Approach 2: Try without ordering and with shared drives support
    if (folderFiles.length === 0) {
      try {
        console.log('Trying approach 2: Without ordering, with shared drives...');
        response = await drive.files.list({
          q: `'${folderId}' in parents and trashed=false`,
          fields: 'files(id,name,mimeType,webViewLink,thumbnailLink,videoMediaMetadata,createdTime,size,parents)',
          pageSize: 100,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true
        });
        folderFiles = response.data.files || [];
        console.log('Approach 2 results:', folderFiles.length, 'files');
      } catch (secondError) {
        console.log('Approach 2 failed:', secondError);
      }
    }

    // Approach 3: Try with different query format
    if (folderFiles.length === 0) {
      try {
        console.log('Trying approach 3: Alternative query format...');
        response = await drive.files.list({
          q: `parents in '${folderId}' and trashed=false`,
          fields: 'files(id,name,mimeType,webViewLink,thumbnailLink,videoMediaMetadata,createdTime,size)',
          pageSize: 100,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true
        });
        folderFiles = response.data.files || [];
        console.log('Approach 3 results:', folderFiles.length, 'files');
      } catch (thirdError) {
        console.log('Approach 3 failed:', thirdError);
      }
    }

    console.log(`Folder ${folderId} query results:`, {
      totalFiles: folderFiles.length,
      query: `'${folderId}' in parents and trashed=false`,
      sampleFiles: folderFiles.slice(0, 3).map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType }))
    });

    // If no files found, it could be an empty folder or permission issue
    if (folderFiles.length === 0) {
      console.log(`No files found in folder ${folderId}. This could be an empty folder or a permissions issue.`);
    }

    // Transform files to our format
    const folderContents: DriveFile[] = folderFiles.map((file) => ({
      id: file.id || '',
      name: file.name || '',
      mimeType: file.mimeType || '',
      webViewLink: file.webViewLink || '',
      thumbnailLink: file.thumbnailLink,
      videoMediaMetadata: file.videoMediaMetadata,
      createdTime: file.createdTime || '',
      size: file.size
    }));

    return NextResponse.json({ 
      files: folderContents,
      folderId 
    });
    
  } catch (error: unknown) {
    console.error('Error fetching folder contents:', error);

    // Check if the error is from Google API and has a 403 status
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 403 && 'errors' in error && Array.isArray(error.errors) && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        (error.errors[0] as { message?: string }).message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${(error.errors[0] as { message?: string }).message || "The authenticated Google account does not have permission for this folder."}`,
        },
        { status: 403 }
      );
    }

    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 404) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // For other types of errors, return a generic 500
    return NextResponse.json(
      { error: 'Failed to fetch folder contents' },
      { status: 500 }
    );
  }
}
