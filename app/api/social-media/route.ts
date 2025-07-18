import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

interface SocialMediaItem {
  id: string;
  type: 'video' | 'photo';
  title: string;
  duration?: string;
  timeAgo: string;
  status: 'HAS_GIF' | 'NEEDS_GIF';
  campaignReady: boolean;
  thumbnail: string;
  contentType?: string;
  platform?: string;
  description?: string;
  caption?: string;
  postLink?: string;
  uploadDate?: string;
  creator?: string;
  additionalNotes?: string;
  driveId?: string | null;
  isFolder?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelName = searchParams.get('modelName');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const getTotalOnly = searchParams.get('getTotalOnly') === 'true';
    
    if (!modelName) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json({ error: 'Page must be >= 1' }, { status: 400 });
    }
    if (limit < 1 || limit > 500) {
      return NextResponse.json({ error: 'Limit must be between 1 and 500' }, { status: 400 });
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
    const SHEET_NAME = `${modelName.charAt(0).toUpperCase() + modelName.slice(1).toLowerCase()} - SOCIAL MEDIA`;
    
    // First, get the total count of rows to determine pagination
    const totalCountRange = `${SHEET_NAME}!B4:B`; // Get all B column values to count rows
    const countResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: totalCountRange,
      valueRenderOption: 'FORMATTED_VALUE', // Just for counting, don't need formulas
    });

    const allBColumnValues = countResponse.data.values || [];
    // Filter out empty rows
    const totalRows = allBColumnValues.filter(row => row[0] && row[0].trim() !== '').length;
    const totalPages = Math.ceil(totalRows / limit);

    console.log(`📊 Social Media API: Total rows: ${totalRows}, Page: ${page}/${totalPages}, Limit: ${limit}`);

    // If only requesting total count, return early
    if (getTotalOnly) {
      return NextResponse.json({ 
        totalItems: totalRows, 
        totalPages: totalPages,
        currentPage: page,
        itemsPerPage: limit
      });
    }

    // Calculate the range for the current page
    const startRow = 4 + (page - 1) * limit; // Start from row 4, add offset for pagination
    const endRow = startRow + limit - 1;
    const RANGE = `${SHEET_NAME}!B${startRow}:L${endRow}`;
    
    console.log(`📄 Fetching range: ${RANGE}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueRenderOption: 'FORMULA', // Get formulas instead of display values
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ contentItems: [] });
    }

    // Transform the data to match our ContentItem interface
    const contentItems: SocialMediaItem[] = rows
      .map((row: string[], index: number) => {
        const [
          contentCode, // Column B - Content Code (contains HYPERLINK with file ID)
          contentType, // Column C - Content Type
          platform, // Column D - Platform
          description, // Column E - Description
          caption, // Column F - Caption
          postLink, // Column G - Post Link
          uploadDate, // Column H - Upload Date
          , // Column I - (empty)
          creator, // Column J - Creator @'s
          additionalNotes // Column K - Additional Notes
        ] = row;

        // Skip rows without content code (empty rows)
        if (!contentCode || contentCode.trim() === '') {
          return null;
        }

        // Extract file ID from HYPERLINK formula or direct URL
        // Format: =HYPERLINK("https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk", "DISPLAY_TEXT")
        let driveId = null;
        let title = contentCode; // fallback to content code
        
        if (contentCode.startsWith('=HYPERLINK(')) {
          // Parse HYPERLINK formula
          const hyperlinkMatch = contentCode.match(/=HYPERLINK\("([^"]+)"/);
          const displayTextMatch = contentCode.match(/"([^"]+)"\s*\)$/);
          
          if (hyperlinkMatch) {
            const url = hyperlinkMatch[1];
            const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
            const folderIdMatch = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
            
            driveId = fileIdMatch ? fileIdMatch[1] : (folderIdMatch ? folderIdMatch[1] : null);
            
            if (displayTextMatch) {
              title = displayTextMatch[1];
            }
          }
        } else {
          // Handle direct URLs or plain text
          const fileIdMatch = contentCode.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
          const folderIdMatch = contentCode.match(/\/folders\/([a-zA-Z0-9-_]+)/);
          
          driveId = fileIdMatch ? fileIdMatch[1] : (folderIdMatch ? folderIdMatch[1] : null);
        }
        
        const isFolder = false; // Social media items are typically files
        
        console.log(`Processing social media content: ${contentCode}`, {
          driveId,
          title,
          contentType,
          platform,
          isHyperlink: contentCode.startsWith('=HYPERLINK(')
        });
        
        // Generate thumbnail URL using our image proxy
        const thumbnail = driveId
          ? `/api/image-proxy?id=${driveId}`
          : `https://via.placeholder.com/400x225/374151/9ca3af?text=${encodeURIComponent(title.substring(0, 20))}`;

        // Parse upload date
        const timeAgo = uploadDate ? getTimeAgo(new Date(uploadDate)) : 'Unknown';
        
        // Determine if it's video or photo based on content type
        const itemType = contentType && contentType.toLowerCase().includes('video') ? 'video' : 'photo';
        
        return {
          id: `social_${index + 1}`,
          type: itemType,
          title: title.trim(),
          duration: itemType === 'video' ? 'Unknown' : undefined,
          timeAgo,
          status: 'HAS_GIF' as const, // Default status for social media content
          campaignReady: false, // Default to false
          thumbnail,
          contentType,
          platform,
          description,
          caption,
          postLink,
          uploadDate,
          creator,
          additionalNotes,
          driveId,
          isFolder
        };
      })
      .filter((item) => item !== null) as SocialMediaItem[];

    return NextResponse.json({ 
      contentItems,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalRows,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error fetching social media content:', error);

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
      { error: 'Failed to fetch social media content' },
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