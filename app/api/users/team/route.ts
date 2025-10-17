import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { google } from 'googleapis';

// Extract spreadsheet ID from URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const query = searchParams.get('q') || '';

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    // Extract team row number from teamId (format: "team-8", "team-9", etc.)
    const teamRowMatch = teamId.match(/^team-(\d+)$/);
    if (!teamRowMatch) {
      return NextResponse.json({ error: "Invalid team ID format" }, { status: 400 });
    }

    const teamRow = parseInt(teamRowMatch[1]);

    // Set up Google Sheets API
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

    // Default spreadsheet URL (this should match the one used in PodComponent)
    const DEFAULT_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1sTp3x6SA4yKkYEwPUIDPNzAPiu0RnaV1009NXZ7PkZM/edit?gid=0#gid=0";
    const spreadsheetId = extractSpreadsheetId(DEFAULT_SPREADSHEET_URL);

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Invalid spreadsheet configuration" }, { status: 500 });
    }

    try {
      // Fetch team members from column E of the specified row
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `E${teamRow}`,
      });

      const values = response.data.values;
      
      if (!values || !values[0]) {
        return NextResponse.json({
          success: true,
          users: [],
        });
      }

      // Parse members from comma-separated email string
      const membersString = values[0][0] || '';
      const teamMemberEmails = membersString
        .split(',')
        .map((email: string) => email.trim())
        .filter((email: string) => email && email.includes('@'));

      if (teamMemberEmails.length === 0) {
        return NextResponse.json({
          success: true,
          users: [],
        });
      }

      // If query is provided, filter team members by the search term
      let filteredEmails = teamMemberEmails;
      if (query && query !== 'POD_USERS_ALL' && query.length >= 2) {
        const queryLower = query.toLowerCase();
        filteredEmails = teamMemberEmails.filter(email => 
          email.toLowerCase().includes(queryLower) ||
          email.split('@')[0].toLowerCase().includes(queryLower)
        );
      }

      // Format the users for the dropdown
      const users = filteredEmails.map((email, index) => ({
        id: `team-member-${teamRow}-${index}`,
        name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format email as name
        email: email,
        role: 'POD',
        image: null // Google Sheets team members don't have profile images
      }));

      return NextResponse.json({
        success: true,
        users: users.slice(0, 10), // Limit to 10 results
      });

    } catch (sheetsError) {
      console.error('Error fetching team members from Google Sheets:', sheetsError);
      return NextResponse.json(
        { error: 'Failed to access team data. Please check permissions.' },
        { status: 403 }
      );
    }

  } catch (error) {
    console.error('Error in team users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
