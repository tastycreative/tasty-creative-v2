import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const SPREADSHEET_ID = "1Ad_I-Eq11NWKT1jqPB9Bw6L1jVKBHHLqR4ZBLBT9XtU";

export async function GET(): Promise<NextResponse> {
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

    // Set up OAuth2 client with Auth.js session tokens
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

    const sheets: sheets_v4.Sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // Get spreadsheet info to find first sheet
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const firstSheetTitle = spreadsheet.data.sheets?.[0]?.properties?.title;

    if (!firstSheetTitle) {
      return NextResponse.json([], { status: 200 });
    }

    // Fetch data from the first sheet
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${firstSheetTitle}!A:Z`,
    });

    const values = data.values ?? [];

    if (values.length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    const headers = values[0] as string[];
    const modelIndex = headers.indexOf("Model");

    if (modelIndex === -1) {
      return NextResponse.json({ error: "Model column not found" }, { status: 400 });
    }

    // Filter and format rows for pod-new onboarding dashboard
    const rows = values.slice(1)
      .filter((row) => row[modelIndex]?.trim()) // filter rows with non-empty "Model"
      .map((row) => {
        const rowObj: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowObj[header] = row[index]?.trim() || "";
        });
        return rowObj;
      });

    // Add additional metadata for pod-new dashboard
    const responseData = {
      models: rows,
      totalModels: rows.length,
      lastUpdated: new Date().toISOString(),
      sheetId: SPREADSHEET_ID,
      tasks: headers.filter(h => h !== "Model" && h !== "Status")
    };

    return NextResponse.json(responseData, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ Error fetching POD onboarding data:", error);

    // Handle Google API permission errors specifically
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error("Google API Permission Error (403):", error.errors[0].message);
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the Google Sheet."}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: "Failed to fetch POD onboarding data" }, { status: 500 });
  }
}