import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const searchTitle = searchParams.get('searchTitle');
    
    if (!folderId || !searchTitle) {
      return NextResponse.json({ error: 'Folder ID and search title are required' }, { status: 400 });
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

    // List files in the folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,thumbnailLink,mimeType)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 1000 // Get more files to increase chance of finding match
    });

    const files = response.data.files || [];
    
    // Search for files that match the title
    const matchingFiles = files.filter(file => {
      const fileName = file.name || '';
      const searchTitleLower = searchTitle.toLowerCase();
      const fileNameLower = fileName.toLowerCase();
      
      // Try different matching strategies
      return (
        // Exact match
        fileNameLower === searchTitleLower ||
        // Title is contained in filename
        fileNameLower.includes(searchTitleLower) ||
        // Filename is contained in title
        searchTitleLower.includes(fileNameLower) ||
        // Remove common video extensions and try again
        fileNameLower.replace(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i, '') === searchTitleLower ||
        // Remove file extension from search title and try again
        fileNameLower === searchTitleLower.replace(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i, '')
      );
    });

    // Prioritize image files for thumbnails, then video files
    const imageFiles = matchingFiles.filter(file => 
      file.mimeType?.startsWith('image/') && file.thumbnailLink
    );
    const videoFiles = matchingFiles.filter(file => 
      file.mimeType?.startsWith('video/') && file.thumbnailLink
    );
    
    // Return the best match
    let bestMatch = null;
    if (imageFiles.length > 0) {
      bestMatch = imageFiles[0];
    } else if (videoFiles.length > 0) {
      bestMatch = videoFiles[0];
    } else if (matchingFiles.length > 0) {
      bestMatch = matchingFiles[0];
    }

    if (bestMatch && bestMatch.thumbnailLink) {
      return NextResponse.json({
        thumbnailLink: bestMatch.thumbnailLink,
        fileName: bestMatch.name,
        fileId: bestMatch.id,
        mimeType: bestMatch.mimeType,
        searchTitle,
        matchingFilesCount: matchingFiles.length
      });
    }

    return NextResponse.json({ 
      error: 'No matching file with thumbnail found',
      searchTitle,
      filesSearched: files.length,
      matchingFilesCount: matchingFiles.length
    }, { status: 404 });
    
  } catch (error: any) {
    console.error('Error searching folder contents:', error);

    // Check if the error is from Google API and has a 403 status
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission to access this folder."}`,
        },
        { status: 403 }
      );
    }

    // For other types of errors, return a generic 500
    return NextResponse.json(
      { error: 'Failed to search folder contents' },
      { status: 500 }
    );
  }
}