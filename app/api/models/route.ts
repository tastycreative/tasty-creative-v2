/* eslint-disable @typescript-eslint/no-explicit-any */
import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const SPREADSHEET_ID = process.env.GOOGLE_DRIVE_SHEET_MODEL_NAMES;
const MODEL_HEADER = "Client Name";
const MODEL_PROFILE = "Profile Link";
const MODEL_STATUS = "Status";
const TARGET_SHEET_TITLE = "Client Info";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    // Check for required environment variables
    if (!SPREADSHEET_ID) {
      console.error("Missing GOOGLE_DRIVE_SHEET_MODEL_NAMES environment variable");
      return NextResponse.json(
        { error: "Server configuration error: Missing spreadsheet ID" },
        { status: 500 }
      );
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("Missing Google OAuth credentials");
      return NextResponse.json(
        { error: "Server configuration error: Missing OAuth credentials" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const showAll = url.searchParams.get("all") === "true";

    const session = await auth();
    if (!session || !session.user || !session.accessToken) {
      console.error("Authentication failed: No session or access token");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

    const sheets: sheets_v4.Sheets = google.sheets({
      version: "v4",
      auth: oauth2Client,
    });

    console.log(`Fetching sheet data from: ${SPREADSHEET_ID}, range: ${TARGET_SHEET_TITLE}!A:Z`);

    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TARGET_SHEET_TITLE}!A:Z`,
    });

    console.log(`Successfully fetched ${sheetData.data.values?.length || 0} rows from sheet`);

    const values = sheetData.data.values ?? [];
    if (values.length === 0) {
      return NextResponse.json({ message: "No models found" });
    }

    const headers: string[] = values[0] as string[];
    const nameIndex = headers.indexOf(MODEL_HEADER);
    const profileIndex = headers.indexOf(MODEL_PROFILE);
    const statusIndex = headers.indexOf(MODEL_STATUS);

    if (nameIndex === -1 || profileIndex === -1 || statusIndex === -1) {
      return NextResponse.json({ message: "Required columns not found in sheet" });
    }

    const models: any[] = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i] as string[];

      if (showAll) {
        const fullRow: Record<string, string> = {};
        headers.forEach((header, index) => {
          fullRow[header] = row[index]?.trim() || "";
        });
        models.push(fullRow);
      } else {
        const name = row[nameIndex]?.trim();
        const profile = row[profileIndex]?.trim() || "";
        const status = row[statusIndex]?.trim() || "Unknown";

        if (name) {
          models.push({ name, profile, status });
        }
      }
    }

    return NextResponse.json({ models });

  } catch (error: any) {
    console.error("Error fetching models:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      errors: error.errors,
      stack: error.stack,
    });

    // Handle specific Google API errors
    if (error.code === 403) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors?.[0]?.message || error.message || "Permission denied"}`,
        },
        { status: 403 }
      );
    }

    if (error.code === 401 || error.message?.includes("invalid_grant")) {
      return NextResponse.json(
        {
          error: "TokenExpired",
          message: "OAuth token expired or invalid. Please sign in again.",
        },
        { status: 401 }
      );
    }

    if (error.code === 404) {
      return NextResponse.json(
        {
          error: "SpreadsheetNotFound",
          message: "The requested spreadsheet could not be found.",
        },
        { status: 404 }
      );
    }

    // Generic error response with more details in development
    return NextResponse.json(
      {
        error: "ServerError",
        message: "An unexpected error occurred while fetching models.",
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
}
