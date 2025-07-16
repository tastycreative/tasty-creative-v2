import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

interface VaultContentItem {
  id: string;
  type: 'video';
  title: string;
  duration: string;
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
    const SHEET_NAME = `${modelName.toUpperCase()} - Vault New`;
    const RANGE = `${SHEET_NAME}!A4:M1000`; // Starting from row 4 as per your example
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ contentItems: [] });
    }

    // Transform the data to match our ContentItem interface
    const contentItems: VaultContentItem[] = rows
      .map((row: string[], index: number) => {
        const [
          , // Column A - skip first column
          videoTitle, // Column B - Video Title
          videoCategory, // Column C
          featuredEvents, // Column D
          , // status - unused for now (Column E)
          caption, // Column F
          , // linkDrop - unused (Column G)
          , // priceSet - unused (Column H)
          additionalNotes, // Column I
          videoLink, // Column J
          creationDate, // Column K
          creatorHandles, // Column L
          videoLength, // Column M
          results // Column N
        ] = row;

        // Skip rows without a video title (empty rows)
        if (!videoTitle || videoTitle.trim() === '') {
          return null;
        }


        // Extract Google Drive file ID or folder ID from the link
        const fileIdMatch = videoLink?.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        const folderIdMatch = videoLink?.match(/\/folders\/([a-zA-Z0-9-_]+)/);
        
        const driveId = fileIdMatch ? fileIdMatch[1] : (folderIdMatch ? folderIdMatch[1] : null);
        const isFolder = !!folderIdMatch;
        
        console.log(`Processing video link: ${videoLink}`, {
          fileIdMatch: fileIdMatch?.[1],
          folderIdMatch: folderIdMatch?.[1],
          driveId,
          isFolder,
          title: videoTitle
        });
        
        // Generate thumbnail URL using Google's lh3.googleusercontent.com service
        const thumbnail = driveId && !isFolder
          ? `https://lh3.googleusercontent.com/d/${driveId}`
          : `https://via.placeholder.com/400x225/374151/9ca3af?text=${isFolder ? 'Folder' : encodeURIComponent(videoTitle.substring(0, 20))}`;

        // Parse creation date
        const timeAgo = creationDate ? getTimeAgo(new Date(creationDate)) : 'Unknown';
        
        return {
          id: `vault_${index + 1}`,
          type: 'video' as const,
          title: videoTitle.trim(), // Use the actual video title from the spreadsheet
          duration: videoLength || 'Unknown',
          timeAgo,
          status: 'HAS_GIF' as const, // Changed to HAS_GIF so they show in Vault NEW tab
          campaignReady: false, // Default to false for now
          thumbnail,
          category: videoCategory,
          featuredEvents,
          caption,
          videoLink,
          creationDate,
          creator: creatorHandles,
          results,
          additionalNotes,
          isVaultNew: true, // Flag to identify items from Vault New sheet
          driveId,
          isFolder
        };
      })
      .filter((item) => item !== null) as VaultContentItem[]; // Filter out null/empty rows

    return NextResponse.json({ contentItems });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error fetching vault content:', error);

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
      { error: 'Failed to fetch vault content' },
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
