import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    // Try different authentication methods
    let sheets;

    // First, try with API key for public spreadsheets
    if (process.env.AUTH_API_KEY) {
      console.log("Trying API key authentication for sheets");
      try {
        sheets = google.sheets({
          version: "v4",
          auth: process.env.AUTH_API_KEY,
        });

        // We'll test this later when making the actual API call
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

      console.log("Using session-based authentication for sheets");
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

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, message: "Spreadsheet ID is required" },
        { status: 400 }
      );
    }

    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
      });

      // Extract sheet information and filter out hidden sheets
      const sheetsList =
        response.data.sheets
          ?.map((sheet) => ({
            name: sheet.properties?.title || "",
            gid: sheet.properties?.sheetId?.toString() || "",
            hidden: sheet.properties?.hidden || false,
          }))
          .filter((sheet) => !sheet.hidden) || []; // Filter out hidden sheets

      console.log(`Successfully fetched ${sheetsList.length} sheets`);
      return NextResponse.json({
        success: true,
        sheets: sheetsList,
      });
    } catch (sheetsError) {
      console.error("Error fetching sheets from Google Sheets:", sheetsError);

      // If API key failed and we haven't tried OAuth yet, try OAuth
      if (process.env.AUTH_API_KEY && !sheets.auth.credentials) {
        console.log("API key authentication failed, trying OAuth...");

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
            const oauthResponse = await oauthSheets.spreadsheets.get({
              spreadsheetId: spreadsheetId,
            });

            const sheetsList =
              oauthResponse.data.sheets
                ?.map((sheet) => ({
                  name: sheet.properties?.title || "",
                  gid: sheet.properties?.sheetId?.toString() || "",
                  hidden: sheet.properties?.hidden || false,
                }))
                .filter((sheet) => !sheet.hidden) || [];

            console.log(
              `OAuth fallback successful, fetched ${sheetsList.length} sheets`
            );
            return NextResponse.json({
              success: true,
              sheets: sheetsList,
            });
          }
        } catch (oauthError) {
          console.error("OAuth fallback also failed:", oauthError);
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
    console.error("Error in get-sheets API:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
