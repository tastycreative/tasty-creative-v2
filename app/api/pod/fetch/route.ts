import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

// Extract spreadsheet ID from URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
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

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const { spreadsheetUrl, rowNumber = 8 } = await request.json();

    if (!spreadsheetUrl) {
      return NextResponse.json(
        { error: 'Spreadsheet URL is required' },
        { status: 400 }
      );
    }

    // Extract spreadsheet ID from URL
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
    
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Invalid Google Sheets URL' },
        { status: 400 }
      );
    }

    // Define the ranges to fetch data from a specific row
    const ranges = [
      `C${rowNumber}`, // Team name
      `E${rowNumber}`, // Team members (comma-separated in single cell)
      `F${rowNumber}`, // Creators (comma-separated in single cell)
    ];

    try {
      // Fetch data from multiple ranges
      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheetId,
        ranges: ranges,
      });

      const values = response.data.valueRanges;
      
      if (!values || values.length < 3) {
        return NextResponse.json(
          { error: 'Could not fetch data from spreadsheet' },
          { status: 500 }
        );
      }

      // Parse team name (C{rowNumber})
      const teamNameRange = values[0];
      const teamName = teamNameRange?.values?.[0]?.[0] || `Team ${rowNumber}`;

      // Parse team members (E{rowNumber}) - comma-separated
      const teamMembersRange = values[1];
      const teamMembersString = teamMembersRange?.values?.[0]?.[0] || '';
      const teamMembers = teamMembersString
        .split(',')
        .map((name: string, index: number) => ({
          id: (index + 1).toString(),
          name: name.trim(),
          role: index === 0 ? 'Team Lead' : index === 1 ? 'Designer' : 'Developer'
        }))
        .filter((member: { id: string; name: string; role: string }) => member.name !== '');

      // Parse creators (F{rowNumber}) - comma-separated
      const creatorsRange = values[2];
      const creatorsString = creatorsRange?.values?.[0]?.[0] || '';
      const creators = creatorsString
        .split(',')
        .map((name: string, index: number) => ({
          id: (index + 1).toString(),
          name: name.trim(),
          specialty: index === 0 ? '$15,000' : '$18,500' // Default values, you can make these dynamic too
        }))
        .filter((creator: { id: string; name: string; specialty: string }) => creator.name !== '');

      // Return the parsed data
      return NextResponse.json({
        success: true,
        data: {
          teamName,
          teamMembers,
          creators,
          rowNumber,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (sheetsError) {
      console.error('Error fetching from Google Sheets:', sheetsError);
      return NextResponse.json(
        { error: 'Failed to access Google Sheets. Please check permissions.' },
        { status: 403 }
      );
    }

  } catch (error) {
    console.error('Error in POD fetch API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
