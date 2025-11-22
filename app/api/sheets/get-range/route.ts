import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    // Try different authentication methods
    let sheets;

    // First, try with API key for public spreadsheets
    if (process.env.AUTH_API_KEY) {
      console.log("Trying API key authentication for range data");
      try {
        sheets = google.sheets({
          version: "v4",
          auth: process.env.AUTH_API_KEY,
        });
      } catch (apiKeyError) {
        console.log("API key setup failed:", apiKeyError.message);
        sheets = null;
      }
    }

    // If API key failed or not available, try session-based authentication
    if (!sheets) {
      const session = await auth();

      if (!session || !session.user || !session.accessToken) {
        return NextResponse.json(
          {
            error:
              "Authentication not available - need user login or valid API key",
          },
          { status: 401 }
        );
      }

      console.log("Using session-based authentication for range data");
      const oauth2Client = new google.auth.OAuth2(
        process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
        process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXTAUTH_URL
      );

      oauth2Client.setCredentials({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
        expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
      });

      sheets = google.sheets({ version: "v4", auth: oauth2Client });
    }

    const { searchParams } = new URL(request.url);
    const spreadsheetId = searchParams.get("spreadsheetId");
    const range = searchParams.get("range");

    if (!spreadsheetId || !range) {
      return NextResponse.json(
        { success: false, message: "Spreadsheet ID and range are required" },
        { status: 400 }
      );
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range,
      });

      console.log(`Successfully fetched range data for: ${range}`);
      return NextResponse.json({
        success: true,
        values: response.data.values || [],
        range: response.data.range || range,
      });
    } catch (sheetsError) {
      console.error(
        "Error fetching range data from Google Sheets:",
        sheetsError
      );

      // If API key failed and we haven't tried OAuth yet, try OAuth
      if (process.env.AUTH_API_KEY && !sheets.auth.credentials) {
        console.log("API key authentication failed for range, trying OAuth...");

        try {
          const session = await auth();

          if (session && session.user && session.accessToken) {
            const oauth2Client = new google.auth.OAuth2(
              process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
              process.env.AUTH_GOOGLE_SECRET ||
                process.env.GOOGLE_CLIENT_SECRET,
              process.env.NEXTAUTH_URL
            );

            oauth2Client.setCredentials({
              access_token: session.accessToken,
              refresh_token: session.refreshToken,
              expiry_date: session.expiresAt
                ? session.expiresAt * 1000
                : undefined,
            });

            const oauthSheets = google.sheets({
              version: "v4",
              auth: oauth2Client,
            });
            const oauthResponse = await oauthSheets.spreadsheets.values.get({
              spreadsheetId: spreadsheetId,
              range: range,
            });

            console.log(`OAuth fallback successful for range: ${range}`);
            return NextResponse.json({
              success: true,
              values: oauthResponse.data.values || [],
              range: oauthResponse.data.range || range,
            });
          }
        } catch (oauthError) {
          console.error("OAuth fallback also failed for range:", oauthError);
        }
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to access Google Sheets. Please check permissions.",
        },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error in get-range API:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
