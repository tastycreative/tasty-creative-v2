import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    console.log("Starting form submission...");

    const session = await auth();

    if (!session || !session.user) {
      console.log("Not authenticated. No session or user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      console.log("Not authenticated. No access token found in session.");
      return NextResponse.json({ error: "Not authenticated. No access token." }, { status: 401 });
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

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const { spreadsheetId, data } = await request.json();

    console.log(`Submitting to spreadsheet: ${spreadsheetId}`);

    // Get headers to map data correctly
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:Z1',
    });

    const headers = headerResponse.data.values?.[0] || [];
    
    // Create row data in correct order
    const rowData = headers.map((header: string, index: number) => {
      if (index === 0) { // Column A - User
        return data.User || `${session.user?.name || ''} (${session.user?.email || ''})`;
      }
      if (index === 1) { // Column B - Timestamp
        return data.Timestamp || new Date().toISOString();
      }
      
      // For other columns, match by header name
      const headerClean = header.replace(' - required', '').trim();
      
      // Try to find the data by column letter (C, D, E, etc.)
      const columnLetter = String.fromCharCode(65 + index);
      
      // First check if data has the column letter key, then check by header name
      return data[columnLetter] || data[headerClean] || '';
    });

    // Append to spreadsheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:Z',
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData],
      },
    });

    console.log("Form submitted successfully");

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error submitting form:", error);

    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error("Google API Permission Error (403):", error.errors[0].message);
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || 'The authenticated Google account does not have permission to edit this spreadsheet.'}`
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
