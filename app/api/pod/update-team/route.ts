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

    const { spreadsheetUrl, rowNumber, newTeamName, newSheetUrl, newCreators } = await request.json();

    if (!spreadsheetUrl || !rowNumber || (!newTeamName && !newSheetUrl && !newCreators)) {
      return NextResponse.json(
        { error: 'Spreadsheet URL, row number, and at least one update field (team name, sheet URL, or creators) are required' },
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

    const updates = [];
    const batchRequests = [];
    let message = '';
    let updatedData: any = {};

    // Update team name if provided (Column C)
    if (newTeamName) {
      const teamNameRange = `C${rowNumber}`;
      updates.push({
        range: teamNameRange,
        values: [[newTeamName]]
      });
      updatedData.teamName = newTeamName;
      message += `Team name updated. `;
    }

    // Update sheet URL if provided (Column D) - create as smart chip
    if (newSheetUrl) {
      // Validate Google Sheets URL format
      const isValidGoogleSheetsUrl = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/.test(newSheetUrl);
      if (!isValidGoogleSheetsUrl) {
        return NextResponse.json(
          { error: 'Invalid Google Sheets URL format' },
          { status: 400 }
        );
      }

      // Method 1: Insert URL as plain text with USER_ENTERED to trigger smart chip auto-conversion
      try {
        const sheetUrlRange = `D${rowNumber}`;
        
        // Use USER_ENTERED which allows Google Sheets to auto-convert URLs to smart chips
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: sheetUrlRange,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[newSheetUrl]]
          }
        });

        updatedData.sheetUrl = newSheetUrl;
        message += `Sheet URL updated with smart chip auto-conversion. `;
      } catch (autoConvertError) {
        console.log('Auto-conversion failed, trying manual approach:', autoConvertError);
        
        // Method 2: Fallback to batch update if direct update fails
        const sheetUrlRange = `D${rowNumber}`;
        updates.push({
          range: sheetUrlRange,
          values: [[newSheetUrl]]
        });
        updatedData.sheetUrl = newSheetUrl;
        message += `Sheet URL updated (fallback method). `;
      }
    }

    // Update creators if provided (Column F)
    if (newCreators !== undefined) {
      const creatorsRange = `F${rowNumber}`;
      const creatorsString = Array.isArray(newCreators) ? newCreators.join(', ') : newCreators;
      updates.push({
        range: creatorsRange,
        values: [[creatorsString]]
      });
      updatedData.creators = newCreators;
      message += `Creators updated. `;
    }

    // Perform batch update if there are any updates
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED', // This allows formulas to be processed
          data: updates
        }
      });

      console.log(`Updated team data at row ${rowNumber}:`, updatedData);
    }

    return NextResponse.json({
      success: true,
      message: message.trim() || 'Team updated successfully',
      updatedData,
      rowNumber
    });

  } catch (error) {
    console.error('Error updating team name:', error);
    
    // Handle quota exceeded errors specifically
    if (error instanceof Error && error.message.includes('Quota exceeded')) {
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
      { error: 'Failed to update team name' },
      { status: 500 }
    );
  }
}