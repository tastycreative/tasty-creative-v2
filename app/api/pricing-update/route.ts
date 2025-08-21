import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

const SHEET_ID = '1wv_XfkNu5Iu3JUgNgUJoH7sfYeMJjOEvR9MtG36e7aA';

// Helper function to convert column number to letter notation (1=A, 2=B, ..., 27=AA, 28=AB, 29=AC, etc.)
function numberToColumnLetter(columnNumber: number): string {
  let result = '';
  while (columnNumber > 0) {
    columnNumber--; // Make it 0-based
    result = String.fromCharCode(65 + (columnNumber % 26)) + result;
    columnNumber = Math.floor(columnNumber / 26);
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated. No access token." },
        { status: 401 }
      );
    }

    const { creatorName, itemName, newPrice, creatorRowNumber } = await request.json();

    if (!creatorName || !itemName) {
      return NextResponse.json(
        { error: "Creator name and item name are required" },
        { status: 400 }
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

    // First, get the headers row to find the item column (fetch more columns to ensure we get all headers)
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Client Info!A1:BB1', // First row contains headers, fetch up to column BB from Client Info sheet
    });

    console.log('Raw headers response:', JSON.stringify(headersResponse.data, null, 2));
    
    const headers = headersResponse.data.values?.[0] || [];
    
    // Debug: Log all headers to help troubleshoot
    console.log('Headers array length:', headers.length);
    console.log('All headers found:', headers.map((h, i) => `${i+1}: "${h}"`));
    console.log('Looking for item:', itemName);
    
    // If no headers found, try a different approach
    if (headers.length === 0) {
      console.log('No headers found in Client Info!A1:BB1, trying just Client Info!A1:Z1...');
      const fallbackResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Client Info!A1:Z1',
      });
      console.log('Fallback response:', JSON.stringify(fallbackResponse.data, null, 2));
    }
    
    // Find the column index for the item name
    const itemColumnIndex = headers.findIndex(header => 
      header && header.trim().toLowerCase() === itemName.trim().toLowerCase()
    );

    if (itemColumnIndex === -1) {
      return NextResponse.json(
        { error: `Item "${itemName}" not found in sheet headers` },
        { status: 404 }
      );
    }

    // Use the provided row number instead of searching
    let creatorRowIndex = creatorRowNumber;
    
    // If no row number provided, fall back to searching (for backward compatibility)
    if (!creatorRowIndex) {
      console.log('No row number provided, falling back to search...');
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Client Info!A:A', // Column A contains creator names in Client Info sheet
      });

      const creatorNames = dataResponse.data.values?.flat() || [];
      
      // Find the row index for the creator (adding 1 because sheets are 1-indexed)
      creatorRowIndex = creatorNames.findIndex(name => 
        name && name.trim().toLowerCase() === creatorName.trim().toLowerCase()
      ) + 1;

      if (creatorRowIndex === 0) {
        return NextResponse.json(
          { error: `Creator "${creatorName}" not found in sheet` },
          { status: 404 }
        );
      }
    }

    // Validate column and row limits
    const columnNumber = itemColumnIndex + 1; // +1 because columns are 1-indexed
    if (columnNumber > 100) { // Reasonable limit
      return NextResponse.json(
        { error: `Column ${columnNumber} is too high. Item "${itemName}" may not exist in this sheet.` },
        { status: 400 }
      );
    }
    
    if (creatorRowIndex > 1000) { // Sheet limit
      return NextResponse.json(
        { error: `Row ${creatorRowIndex} exceeds sheet limits. Creator "${creatorName}" may not exist in this sheet.` },
        { status: 400 }
      );
    }

    // Convert column index to letter notation (A, B, C, ..., Z, AA, AB, AC, etc.)
    const columnLetter = numberToColumnLetter(columnNumber);
    
    console.log(`Updating cell: Client Info!${columnLetter}${creatorRowIndex} with value: "${newPrice}"`);
    
    // Update the specific cell
    const updateRange = `Client Info!${columnLetter}${creatorRowIndex}`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: updateRange,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[newPrice || '']],
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${creatorName}'s ${itemName} to ${newPrice || 'empty'}`,
      updatedCell: updateRange
    });

  } catch (error: any) {
    console.error('Error updating pricing data in Google Sheets:', error);

    // Check if the error is from Google API and has a 403 status
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission to edit this Google Sheet."}`,
        },
        { status: 403 }
      );
    }

    // For other types of errors, return a generic 500
    return NextResponse.json(
      { error: "Failed to update pricing data in Google Sheets" },
      { status: 500 }
    );
  }
}