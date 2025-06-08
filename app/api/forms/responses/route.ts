/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    //console.log("Starting responses fetch...");

    const session = await auth();

    if (!session || !session.user) {
      //console.log("Not authenticated. No session or user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      //console.log("Not authenticated. No access token found in session.");
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

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const { searchParams } = new URL(request.url);
    const spreadsheetId = searchParams.get("spreadsheetId");

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Spreadsheet ID is required" },
        { status: 400 }
      );
    }

    //console.log(`Fetching responses from spreadsheet: ${spreadsheetId}`);

    // Get all data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A:Z",
    });

    const rows = response.data.values || [];
    //console.log(`Found ${rows.length} rows (including header)`);

    if (rows.length <= 1) {
      return NextResponse.json({ responses: [] });
    }

    const headers = rows[0];
    const responses = rows.slice(1).map((row, index) => {
      const data: Record<string, any> = {};
      headers.forEach((header, colIndex) => {
        data[header] = row[colIndex] || "";
        // Also add by column letter for form submission
        data[String.fromCharCode(65 + colIndex)] = row[colIndex] || "";
      });

      return {
        id: `response-${index + 1}`,
        formId: spreadsheetId,
        submittedAt: new Date(data.Timestamp || Date.now()),
        data,
      };
    });

    responses.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    //console.log(`Returning ${responses.length} sorted responses`);
    return NextResponse.json({ responses });
  } catch (error: any) {
    console.error("Error fetching responses:", error);

    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission to read this spreadsheet."}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}
