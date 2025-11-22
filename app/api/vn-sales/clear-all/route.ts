import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Add role-based access control
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Set up OAuth2 client with Auth.js session tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    );

    if (!session.accessToken) {
      return NextResponse.json(
        {
          error:
            "No access token available. Please re-authenticate with Google.",
        },
        { status: 401 }
      );
    }

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken || undefined,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    // Check token expiration
    if (
      !session.refreshToken &&
      session.expiresAt &&
      new Date().getTime() > session.expiresAt * 1000
    ) {
      return NextResponse.json(
        {
          error:
            "Access token expired and no refresh token available. Please re-authenticate with Google.",
        },
        { status: 401 }
      );
    }

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const spreadsheetId = "1_a08KImbkIA3z0_DTGWoqJdnRiw1y-kygj-Wr2cB_gk";

    console.log("🗑️ Starting to clear all sales data...");

    try {
      // First, get all sheets in the spreadsheet
      const spreadsheetResponse = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const allSheets = spreadsheetResponse.data.sheets || [];
      const sheetsToProcess = allSheets
        .map((sheet) => sheet.properties?.title)
        .filter((name) => name && name !== "Sheet1"); // Keep Sheet1 if it exists, but clear voice model sheets

      console.log("📋 Found sheets to clear:", sheetsToProcess);

      let clearedSheets = 0;
      let totalRowsCleared = 0;

      // Clear data from each sheet (keeping headers)
      for (const sheetName of sheetsToProcess) {
        if (!sheetName) continue;

        try {
          console.log(`🧹 Clearing data from sheet: ${sheetName}`);

          // Get the current data to count rows
          const currentDataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:K`,
          });

          const currentRows = currentDataResponse.data.values || [];
          const dataRowCount = Math.max(0, currentRows.length - 1); // Subtract header row

          if (dataRowCount > 0) {
            // Clear all data except headers (A2:K1000 to be safe)
            await sheets.spreadsheets.values.clear({
              spreadsheetId,
              range: `${sheetName}!A2:K1000`,
            });

            totalRowsCleared += dataRowCount;
            console.log(`✅ Cleared ${dataRowCount} rows from ${sheetName}`);
          } else {
            console.log(`ℹ️ No data to clear in ${sheetName}`);
          }

          clearedSheets++;
        } catch (sheetError) {
          console.error(`❌ Error clearing sheet ${sheetName}:`, sheetError);
          // Continue with other sheets even if one fails
        }
      }

      console.log(
        `🎉 Successfully cleared ${totalRowsCleared} rows from ${clearedSheets} sheets`
      );

      // Return success response
      return NextResponse.json({
        success: true,
        message: `Successfully cleared all sales data! Removed ${totalRowsCleared} records from ${clearedSheets} model sheets.`,
        data: {
          sheetsCleared: clearedSheets,
          totalRowsCleared,
          clearedSheetNames: sheetsToProcess,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (sheetError: any) {
      console.error(`❌ Error accessing spreadsheet:`, sheetError);

      // Handle specific Google Sheets API errors
      if (sheetError.code === 403) {
        return NextResponse.json(
          {
            error: "GooglePermissionDenied",
            message:
              "Google API permission denied. Please check your Google Sheets access permissions.",
          },
          { status: 403 }
        );
      }

      // Handle quota exceeded errors
      if (sheetError.code === 429) {
        return NextResponse.json(
          {
            error: "QuotaExceeded",
            message:
              "Google Sheets API quota exceeded. Please try again in a few minutes.",
          },
          { status: 429 }
        );
      }

      throw sheetError;
    }
  } catch (error: any) {
    console.error("❌ Error clearing all sales data:", error);

    // Handle specific Google API errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the Google Sheet."}`,
        },
        { status: 403 }
      );
    }

    // Handle token expiration errors
    if (error.message && error.message.includes("invalid_grant")) {
      return NextResponse.json(
        {
          error: "GoogleAuthExpired",
          message:
            "Google authentication has expired. Please refresh the page and sign in again.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to clear sales data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
