import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const SPREADSHEET_ID = process.env.GOOGLE_DRIVE_SHEET_MODEL_NAMES;

const FIELDS = [
  "Client Name",
  "Status",
  "Launch Date",
  "Referrer Name",
  "Personality Type",
  "Common Terms",
  "Common Emojis",
  "Main Instagram @",
  "Main Twitter @",
  "Main TikTok @",
  "Profile Link",
];

// Utility to initialize Google Sheets API client
async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Not authenticated");
  }

  if (!session.accessToken) {
    throw new Error("Not authenticated. No access token.");
  }

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

  return google.sheets({ version: "v4", auth: oauth2Client });
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const modelName = searchParams?.get("name");

  if (!modelName) {
    return NextResponse.json(
      { error: "Model name is required" },
      { status: 400 }
    );
  }

  try {
    const sheets = await getSheetsClient();

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const firstSheetTitle = spreadsheet.data.sheets?.[0]?.properties?.title;
    if (!firstSheetTitle) {
      return NextResponse.json({}, { status: 200 });
    }

    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${firstSheetTitle}!A:Z`,
    });

    const values = sheetData.data.values ?? [];

    if (values.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    const headers: string[] = values[0] as string[];

    const headerIndexes = FIELDS.reduce((acc, field) => {
      const index = headers.indexOf(field);
      acc[field] = index;
      return acc;
    }, {} as Record<string, number>);

    const modelRow = values.find((row, index) => {
      if (index === 0) return false;
      const nameIndex = headerIndexes["Client Name"];
      return row[nameIndex]?.trim().toLowerCase() === modelName.toLowerCase();
    }) as string[] | undefined;

    const result: Record<string, string> = {};
    FIELDS.forEach((field) => {
      const index = headerIndexes[field];
      result[field] =
        index !== -1 && modelRow ? modelRow[index]?.trim() ?? "" : "";
    });

    return NextResponse.json(result, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ Error fetching model details:", error);
    
    // Check for Google API permission errors (403)
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the Google Sheet."}`,
        },
        { status: 403 }
      );
    }

    // Handle authentication errors
    if (error.message === "Not authenticated" || 
        error.message === "Not authenticated. No access token.") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch model details" },
      { status: 500 }
    );
  }
}