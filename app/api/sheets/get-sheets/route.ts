import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

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

    const { searchParams } = new URL(request.url);
    const spreadsheetId = searchParams.get('spreadsheetId');

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, message: 'Spreadsheet ID is required' },
        { status: 400 }
      );
    }

    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
      });

      // Extract sheet information and filter out hidden sheets
      const sheetsList = response.data.sheets?.map(sheet => ({
        name: sheet.properties?.title || '',
        gid: sheet.properties?.sheetId?.toString() || '',
        hidden: sheet.properties?.hidden || false,
      }))
      .filter(sheet => !sheet.hidden) // Filter out hidden sheets
      || [];

      return NextResponse.json({
        success: true,
        sheets: sheetsList
      });

    } catch (sheetsError) {
      console.error('Error fetching sheets from Google Sheets:', sheetsError);
      return NextResponse.json(
        { success: false, message: 'Failed to access Google Sheets. Please check permissions.' },
        { status: 403 }
      );
    }

  } catch (error) {
    console.error('Error in get-sheets API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
