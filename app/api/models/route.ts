import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const SPREADSHEET_ID = process.env.GOOGLE_DRIVE_SHEET_MODEL_NAMES;
const MODEL_HEADER = "Client Name";
const MODEL_PROFILE = "Profile Link";
const MODEL_STATUS = "Status";
const TARGET_SHEET_TITLE = "Client Info";

export async function GET(): Promise<NextResponse> {
  try {
    console.log("Starting GET request for models...");
    
    // Get session using auth function
    const session = await auth();
    if (!session || !session.user) {
      console.log("Not authenticated. No session or user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      console.log("Not authenticated. No access token found in session.");
      return NextResponse.json({ error: "Not authenticated. No access token." }, { status: 401 });
    }

    console.log("Session retrieved:", session);

    // Set up OAuth2 client with session credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined, // Convert seconds to milliseconds
    });

    const sheets: sheets_v4.Sheets = google.sheets({
      version: "v4",
      auth: oauth2Client,
    });

    console.log(`Fetching data from spreadsheetId: ${SPREADSHEET_ID}, sheet: ${TARGET_SHEET_TITLE}`);

    // Get the sheet data
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TARGET_SHEET_TITLE}!A:Z`,
    });

    console.log("Fetched sheet data:", sheetData.data.values);

    // Handle potentially null or undefined values
    const values = sheetData.data.values ?? [];

    if (values.length === 0) {
      console.log("No data found in sheet.");
      return NextResponse.json({ message: "No models found" });
    }

    // Find all column headers
    const headers: string[] = values[0] as string[];
    console.log("Headers found:", headers);

    // Get the indexes for name, profile, and status
    const nameIndex = headers.indexOf(MODEL_HEADER);
    const profileIndex = headers.indexOf(MODEL_PROFILE);
    const statusIndex = headers.indexOf(MODEL_STATUS);

    if (nameIndex === -1 || profileIndex === -1 || statusIndex === -1) {
      console.log(`Required headers not found. Name: ${nameIndex}, Profile: ${profileIndex}, Status: ${statusIndex}`);
      return NextResponse.json({ message: "Required columns not found in sheet" });
    }

    const models: { name: string; profile: string; status: string }[] = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i] as string[];
      const name = row[nameIndex]?.trim();
      const profile = row[profileIndex]?.trim() || ""; // allow missing profiles
      const status = row[statusIndex]?.trim() || "Unknown"; // Default to "Unknown" if status is empty

      if (name) {
        models.push({ name, profile, status });
      }
    }

    console.log("Processed models:", models);
    return NextResponse.json({ models });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching models:", error);

    // Check if the error is from Google API and has a 403 status
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error("Google API Permission Error (403):", error.errors[0].message);
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || 'The authenticated Google account does not have permission for the Google Sheet.'}`
        },
        { status: 403 }
      );
    }

    // For other types of errors, return a generic 500
    return NextResponse.json(
      { message: "An unexpected error occurred while fetching models." },
      { status: 500 }
    );
  }
}