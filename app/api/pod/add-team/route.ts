import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

function extractSpreadsheetId(url: string): string | null {
  try {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
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

    const { spreadsheetUrl, teamName, sheetUrl, rowNumber, creators } = await request.json();

    if (!spreadsheetUrl || !teamName || !sheetUrl || !rowNumber) {
      return NextResponse.json(
        { error: 'Spreadsheet URL, team name, sheet URL, and row number are required' },
        { status: 400 }
      );
    }

    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Invalid Google Sheets URL' },
        { status: 400 }
      );
    }

    // Validate Google Sheets URL format for the team sheet
    const isValidGoogleSheetsUrl = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/.test(sheetUrl);
    if (!isValidGoogleSheetsUrl) {
      return NextResponse.json(
        { error: 'Invalid Google Sheets URL format for team sheet' },
        { status: 400 }
      );
    }

    try {
      // Add the new team to the spreadsheet
      // Column C = Team Name, Column D = Sheet URL, Column E = Members (empty initially), Column F = Creators
      const creatorsString = Array.isArray(creators) ? creators.join(', ') : '';
      
      const updates = [
        {
          range: `C${rowNumber}`,
          values: [[teamName.trim()]]
        },
        {
          range: `D${rowNumber}`,
          values: [[sheetUrl.trim()]]
        },
        {
          range: `E${rowNumber}`,
          values: [['']] // Initialize empty members column
        },
        {
          range: `F${rowNumber}`,
          values: [[creatorsString]] // Add creators as comma-separated string
        }
      ];

      // Use batch update with USER_ENTERED to allow smart chip auto-conversion
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED', // This allows formulas and smart chips to be processed
          data: updates
        }
      });

      console.log(`Added new team "${teamName}" at row ${rowNumber}`);

      return NextResponse.json({
        success: true,
        message: 'Team added successfully',
        data: {
          teamName: teamName.trim(),
          sheetUrl: sheetUrl.trim(),
          rowNumber,
          creators: creatorsString
        }
      });

    } catch (sheetsError) {
      console.error('Error adding team to Google Sheets:', sheetsError);
      
      // Handle quota exceeded errors specifically
      if (sheetsError instanceof Error && sheetsError.message.includes('Quota exceeded')) {
        return NextResponse.json(
          { 
            error: 'Quota exceeded',
            message: 'Google Sheets API quota exceeded. Please try again in a few minutes.',
            retryAfter: 60
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to add team to Google Sheets. Please check permissions.' },
        { status: 403 }
      );
    }

  } catch (error) {
    console.error('Error in add team API:', error);
    return NextResponse.json(
      { error: 'Failed to add team' },
      { status: 500 }
    );
  }
}
