import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

interface SextingSetItem {
  id: string;
  type: 'video';
  title: string;
  duration?: string;
  timeAgo: string;
  status: 'HAS_GIF' | 'NEEDS_GIF';
  campaignReady: boolean;
  thumbnail: string;
  category?: string;
  featuredEvents?: string;
  caption?: string;
  videoLink?: string;
  creationDate?: string;
  creator?: string;
  results?: string;
  additionalNotes?: string;
  isVaultNew?: boolean;
  driveId?: string | null;
  isFolder?: boolean;
  contentCount?: number;
  scriptEditor?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelName = searchParams.get('modelName');
    
    if (!modelName) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
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

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // Google Sheets API configuration
    const SPREADSHEET_ID = '1_BRrKVZbLwnHJCNYsacu5Lx25yJ7eoPpAEsbv1OBwtA';
    const SHEET_NAME = `${modelName.charAt(0).toUpperCase() + modelName.slice(1).toLowerCase()} - SEXTING SETS`;
    const RANGE = `${SHEET_NAME}!B4:K1000`; // B3:K3 for headers, B4:K for data
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ contentItems: [] });
    }

    // Transform the data to match our ContentItem interface
    const contentItems: SextingSetItem[] = rows
      .map((row: string[], index: number) => {
        const [
          sextingSetTitle, // Column B - Sexting Set Title
          sextingSetCategory, // Column C - Sexting Set Category
          featuredEvents, // Column D - Featured Events
          status, // Column E - Status
          additionalNotes, // Column F - Additional Notes
          sextingSetLink, // Column G - Sexting Set Link
          creationDate, // Column H - Creation Date
          creator, // Column I - Creator @'s
          contentCount, // Column J - Content Count
          scriptEditor // Column K - Script Editor
        ] = row;

        // Skip rows without a sexting set title (empty rows)
        if (!sextingSetTitle || sextingSetTitle.trim() === '') {
          return null;
        }

        // Extract Google Drive file ID or folder ID from the link
        const fileIdMatch = sextingSetLink?.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        const folderIdMatch = sextingSetLink?.match(/\/folders\/([a-zA-Z0-9-_]+)/);
        
        const driveId = fileIdMatch ? fileIdMatch[1] : (folderIdMatch ? folderIdMatch[1] : null);
        const isFolder = !!folderIdMatch;
        
        console.log(`Processing sexting set link: ${sextingSetLink}`, {
          fileIdMatch: fileIdMatch?.[1],
          folderIdMatch: folderIdMatch?.[1],
          driveId,
          isFolder,
          title: sextingSetTitle
        });
        
        // Generate thumbnail URL using our image proxy (only for files, not folders)
        const thumbnail = driveId && !isFolder
          ? `/api/image-proxy?id=${driveId}`
          : `https://via.placeholder.com/400x225/374151/9ca3af?text=${isFolder ? 'Folder' : encodeURIComponent(sextingSetTitle.substring(0, 20))}`;

        // Parse creation date
        const timeAgo = creationDate ? getTimeAgo(new Date(creationDate)) : 'Unknown';
        
        return {
          id: `sexting_${index + 1}`,
          type: 'video' as const,
          title: sextingSetTitle.trim(),
          duration: `${contentCount || 0} items`,
          timeAgo,
          status: (status === 'USED' ? 'HAS_GIF' : 'NEEDS_GIF') as 'HAS_GIF' | 'NEEDS_GIF',
          campaignReady: status === 'USED',
          thumbnail,
          category: sextingSetCategory,
          featuredEvents,
          caption: additionalNotes,
          videoLink: sextingSetLink,
          creationDate,
          creator,
          results: scriptEditor,
          additionalNotes,
          isVaultNew: false, // This is sexting sets, not vault new
          driveId,
          isFolder,
          contentCount: parseInt(contentCount) || 0,
          scriptEditor
        };
      })
      .filter((item) => item !== null) as SextingSetItem[];

    return NextResponse.json({ contentItems });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error fetching sexting sets:', error);

    // Check if the error is from Google API and has a 403 status
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the Google Sheet."}`,
        },
        { status: 403 }
      );
    }

    // For other types of errors, return a generic 500
    return NextResponse.json(
      { error: 'Failed to fetch sexting sets' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInDays > 0) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  } else if (diffInHours > 0) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  } else if (diffInMinutes > 0) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
}