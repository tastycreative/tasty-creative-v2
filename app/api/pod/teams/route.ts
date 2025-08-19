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

    const { spreadsheetUrl, startRow = 8, endRow = 20 } = await request.json();

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

    try {
      // Fetch team data from columns C (names), D (sheet URLs), E (members), and F (creators)
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `C${startRow}:F${endRow}`,
      });

      const values = response.data.values;
      
      if (!values) {
        return NextResponse.json(
          { error: 'No data found in the specified range' },
          { status: 404 }
        );
      }

      // Parse team data and create team list
      const teams = values
        .map((row, index) => {
          const rowNumber = startRow + index;
          const teamName = row[0] || '';
          const sheetUrl = row[1] || '';
          const membersString = row[2] || '';
          const creatorsString = row[3] || '';
          
          // Parse members from comma-separated email string
          const members = membersString
            .split(',')
            .map((email: string) => email.trim())
            .filter((email: string) => email)
            .map((email: string, memberIndex: number) => ({
              id: `member-${rowNumber}-${memberIndex}`,
              name: email.split('@')[0], // Use email username as name fallback
              email: email,
              role: 'Member' // Default role
            }));

          // Parse creators from comma-separated string
          const creators = creatorsString
            .split(',')
            .map((creator: string) => creator.trim())
            .filter((creator: string) => creator);

          return {
            row: rowNumber,
            name: teamName,
            label: teamName || `Team ${rowNumber}`,
            sheetUrl: sheetUrl,
            members: members,
            creators: creators
          };
        })
        .filter(team => team.name.trim() !== '');

      // Return the teams list
      return NextResponse.json({
        success: true,
        teams: teams
      });

    } catch (sheetsError) {
      console.error('Error fetching teams from Google Sheets:', sheetsError);
      return NextResponse.json(
        { error: 'Failed to access Google Sheets. Please check permissions.' },
        { status: 403 }
      );
    }

  } catch (error) {
    console.error('Error in teams fetch API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
