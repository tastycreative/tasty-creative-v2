/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { google, sheets_v4 } from 'googleapis';
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    // Get session using Auth.js
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

    const { id, code } = await request.json();

    if (!id || !code) {
      return NextResponse.json(
        { error: "Missing required parameters: id and code" },
        { status: 400 }
      );
    }

    // Set up OAuth2 client with Auth.js session
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

    const sheets: sheets_v4.Sheets = google.sheets({
      version: "v4",
      auth: oauth2Client,
    });

    // Get the sheet metadata to find the correct sheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: id,
    });

    const sheetNames = spreadsheet.data.sheets?.map((sheet: any) => sheet.properties.title) || [];
    
    // Find sheet that contains the code (case insensitive)
    const targetSheetName = sheetNames.find((name: string) => 
      name.toLowerCase().includes(code.toLowerCase())
    );

    if (!targetSheetName) {
      return NextResponse.json(
        { error: `No sheet found containing code: ${code}` },
        { status: 404 }
      );
    }

    // Get all data from the target sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${targetSheetName}!A:Z`, // Get all columns
    });

    const rows = response.data.values || [];
    
    if (rows.length < 2) {
      return NextResponse.json(
        { error: "Sheet does not contain enough data" },
        { status: 400 }
      );
    }

    const headers = rows[0]; // First row contains headers
    const dataRows = rows.slice(1); // Skip header row

    // Find the Caption column (header row index)
    const captionColumnIndex = headers.findIndex((header: string) => 
      header.toLowerCase().includes('caption')
    );

    if (captionColumnIndex === -1) {
      return NextResponse.json(
        { error: "Caption column not found in sheet" },
        { status: 404 }
      );
    }

    // Find columns that contain "MM" in header (these should have "Unlock" values)
    const mmColumnIndices = headers
      .map((header: string, index: number) => 
        header.toLowerCase().includes('mm') ? index : -1
      )
      .filter((index: number) => index !== -1);

    if (mmColumnIndices.length === 0) {
      return NextResponse.json(
        { error: "No MM columns found in sheet" },
        { status: 404 }
      );
    }

    // Find captions where any MM column (column B onwards, row 2 onwards) has "Unlock"
    const unlockedCaptions: string[] = [];

    dataRows.forEach((row: string[], rowIndex: number) => {
      // Check if any MM column in this row has "Unlock" value
      const hasUnlock = mmColumnIndices.some((colIndex: number) => {
        const cellValue = row[colIndex];
        return cellValue && cellValue.toLowerCase().includes('unlock');
      });

      if (hasUnlock && row[captionColumnIndex]) {
        unlockedCaptions.push(row[captionColumnIndex]);
      }
    });

    return NextResponse.json({
      success: true,
      sheetName: targetSheetName,
      code: code,
      unlockedCaptions: unlockedCaptions,
      totalFound: unlockedCaptions.length
    });

  } catch (error: any) {
    console.error('Error fetching Google Sheets data:', error);
    
    // Handle Google API specific errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json({
        error: "GooglePermissionDenied",
        message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for Google Sheets."}`,
      }, { status: 403 });
    }

    // Handle token refresh if needed
    if (error.code === 401) {
      return NextResponse.json(
        { error: "Authentication expired. Please re-authenticate." },
        { status: 401 }
      );
    }

    // Handle spreadsheet not found
    if (error.code === 404) {
      return NextResponse.json(
        { error: "Spreadsheet not found or not accessible." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheets", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST instead." },
    { status: 405 }
  );
}