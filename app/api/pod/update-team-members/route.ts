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

    const { spreadsheetUrl, rowNumber, members } = await request.json();

    if (!spreadsheetUrl || !rowNumber || !Array.isArray(members)) {
      return NextResponse.json(
        { error: 'Spreadsheet URL, row number, and members array are required' },
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

    try {
      // Convert members array to comma-separated email string
      // members should be an array of objects with email property
      const memberEmails = members
        .map(member => member.email)
        .filter(email => email && email.trim())
        .join(', ');

      // Update team members in Column E
      const membersRange = `E${rowNumber}`;
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: membersRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[memberEmails]]
        }
      });

      console.log(`Updated team members at row ${rowNumber}: ${memberEmails}`);

      return NextResponse.json({
        success: true,
        message: 'Team members updated successfully',
        updatedData: {
          members: memberEmails,
          rowNumber
        }
      });

    } catch (sheetsError) {
      console.error('Error updating team members in Google Sheets:', sheetsError);
      
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
        { error: 'Failed to update team members in Google Sheets. Please check permissions.' },
        { status: 403 }
      );
    }

  } catch (error) {
    console.error('Error in update team members API:', error);
    return NextResponse.json(
      { error: 'Failed to update team members' },
      { status: 500 }
    );
  }
}
