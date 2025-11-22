import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const searchTitle = searchParams.get("searchTitle");

    if (!folderId || !searchTitle) {
      return NextResponse.json(
        { error: "Folder ID and search title are required" },
        { status: 400 }
      );
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
      process.env.NEXTAUTH_URL
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Use Google Drive's native search with multiple strategies for better performance
    const searchStrategies = [
      // Strategy 1: Exact name match
      `'${folderId}' in parents and trashed=false and name='${searchTitle}'`,
      // Strategy 2: Name contains search title
      `'${folderId}' in parents and trashed=false and name contains '${searchTitle}'`,
      // Strategy 3: Search without extension
      `'${folderId}' in parents and trashed=false and name contains '${searchTitle.replace(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i, "")}'`,
    ];

    let matchingFiles: any[] = [];
    let searchAttempt = 0;

    // Try each search strategy until we find results
    for (const query of searchStrategies) {
      searchAttempt++;
      console.log(
        `🔍 Search attempt ${searchAttempt} for "${searchTitle}" in folder ${folderId}`
      );
      console.log(`Query: ${query}`);

      try {
        const response: any = await drive.files.list({
          q: query,
          fields: "files(id,name,thumbnailLink,mimeType)",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          pageSize: 100, // Smaller page size for faster response
        });

        const files = response.data.files || [];
        console.log(
          `Found ${files.length} files with search strategy ${searchAttempt}`
        );

        if (files.length > 0) {
          matchingFiles = files;
          break; // Stop searching once we find results
        }
      } catch (searchError) {
        console.error(`Search strategy ${searchAttempt} failed:`, searchError);
        // Continue to next strategy
      }
    }

    // If no results from native search, fall back to broader search with local filtering
    if (matchingFiles.length === 0) {
      console.log(
        `🔄 Falling back to broad search with local filtering for "${searchTitle}"`
      );

      let allFiles: any[] = [];
      let pageToken: string | null = null;
      let pageCount = 0;
      const maxPages = 5; // Limit to prevent timeout (5 * 1000 = 5000 files max)

      do {
        pageCount++;
        console.log(`📄 Fetching page ${pageCount} of folder contents`);

        const response: any = await drive.files.list({
          q: `'${folderId}' in parents and trashed=false`,
          fields: "nextPageToken,files(id,name,thumbnailLink,mimeType)",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          pageSize: 1000,
          pageToken: pageToken || undefined,
        });

        const files = response.data.files || [];
        allFiles.push(...files);
        pageToken = response.data.nextPageToken;

        console.log(
          `📄 Page ${pageCount}: ${files.length} files (total: ${allFiles.length})`
        );
      } while (pageToken && pageCount < maxPages);

      console.log(
        `📊 Total files fetched: ${allFiles.length}, searching locally...`
      );

      // Local filtering with multiple strategies
      matchingFiles = allFiles.filter((file) => {
        const fileName = file.name || "";
        const searchTitleLower = searchTitle.toLowerCase();
        const fileNameLower = fileName.toLowerCase();

        return (
          fileNameLower === searchTitleLower ||
          fileNameLower.includes(searchTitleLower) ||
          searchTitleLower.includes(fileNameLower) ||
          fileNameLower.replace(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i, "") ===
            searchTitleLower ||
          fileNameLower ===
            searchTitleLower.replace(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i, "")
        );
      });
    }

    // Prioritize image files for thumbnails, then video files
    const imageFiles = matchingFiles.filter(
      (file) => file.mimeType?.startsWith("image/") && file.thumbnailLink
    );
    const videoFiles = matchingFiles.filter(
      (file) => file.mimeType?.startsWith("video/") && file.thumbnailLink
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

    console.log(`🎯 Search results for "${searchTitle}":`, {
      totalMatching: matchingFiles.length,
      imageFiles: imageFiles.length,
      videoFiles: videoFiles.length,
      bestMatch: bestMatch?.name || "none",
    });

    if (bestMatch && bestMatch.thumbnailLink) {
      console.log(`✅ Found thumbnail for "${searchTitle}": ${bestMatch.name}`);
      return NextResponse.json({
        thumbnailLink: bestMatch.thumbnailLink,
        fileName: bestMatch.name,
        fileId: bestMatch.id,
        mimeType: bestMatch.mimeType,
        searchTitle,
        matchingFilesCount: matchingFiles.length,
        searchMethod:
          matchingFiles.length > 0 ? "native_search" : "local_filtering",
      });
    }

    console.log(
      `❌ No thumbnail found for "${searchTitle}". Files: ${matchingFiles.length} matching`
    );
    return NextResponse.json(
      {
        error: "No matching file with thumbnail found",
        searchTitle,
        matchingFilesCount: matchingFiles.length,
        matchingFileNames: matchingFiles.slice(0, 5).map((f) => f.name), // Show first 5 matches for debugging
        searchMethod: "failed",
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Error searching folder contents:", error);

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
      { error: "Failed to search folder contents" },
      { status: 500 }
    );
  }
}
