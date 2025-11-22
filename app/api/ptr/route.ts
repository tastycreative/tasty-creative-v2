import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

const SHEET_ID =
  process.env.LIBRARY_SHEET_ID ||
  "1rrRsS69FLFSBodvAq1Loaa90euf2A5gidbiSrJUhFyc";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, title, creator, isPTR, updatedAt } = body;

    if (!itemId || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Google Sheets API with OAuth2
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
      process.env.NEXTAUTH_URL
    );

    // Set credentials from session
    const credentials: any = {
      access_token: (session as any).accessToken,
    };

    if ((session as any).refreshToken) {
      credentials.refresh_token = (session as any).refreshToken;
    }

    oauth2Client.setCredentials(credentials);
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // Try to find or create a "PTR Tracking" sheet
    let ptrSheetName = "PTR Tracking";

    try {
      // Check if PTR Tracking sheet exists
      await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${ptrSheetName}!A1:A1`,
      });
    } catch (error) {
      // Create PTR Tracking sheet if it doesn't exist
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: ptrSheetName,
                    gridProperties: {
                      rowCount: 1000,
                      columnCount: 12,
                    },
                  },
                },
              },
            ],
          },
        });

        // Add headers to the new sheet
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${ptrSheetName}!A1:L1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [
              [
                "Item ID",
                "Title",
                "Creator",
                "Is PTR",
                "Last Sent",
                "Send Count",
                "Revenue",
                "Buys",
                "Updated At",
                "Updated By",
                "Created At",
                "Notes",
              ],
            ],
          },
        });
      } catch (createError) {
        console.error("Error creating PTR Tracking sheet:", createError);
        return NextResponse.json(
          { error: "Failed to create PTR tracking sheet" },
          { status: 500 }
        );
      }
    }

    // Check if item already exists in PTR tracking
    const existingPTRData = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${ptrSheetName}!A:L`,
    });

    const rows = existingPTRData.data.values || [];
    const existingRowIndex = rows.findIndex(
      (row, index) => index > 0 && row[0] === itemId
    );

    if (existingRowIndex > 0) {
      // Update existing PTR entry
      const existingRow = rows[existingRowIndex];
      const updateRange = `${ptrSheetName}!A${existingRowIndex + 1}:L${existingRowIndex + 1}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: updateRange,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              itemId,
              title,
              creator,
              isPTR ? "TRUE" : "FALSE",
              existingRow[4] || "", // Last Sent (preserve existing)
              existingRow[5] || "0", // Send Count (preserve existing)
              existingRow[6] || "0", // Revenue (preserve existing)
              existingRow[7] || "0", // Buys (preserve existing)
              updatedAt,
              session.user?.email || session.user?.name || "Unknown",
              existingRow[10] || updatedAt, // Created At (preserve existing or use current)
              existingRow[11] || "", // Notes (preserve existing)
            ],
          ],
        },
      });
    } else if (isPTR) {
      // Add new PTR entry (only if marking as PTR)
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${ptrSheetName}!A:L`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [
            [
              itemId,
              title,
              creator,
              "TRUE",
              "", // Last Sent
              "0", // Send Count
              "0", // Revenue
              "0", // Buys
              updatedAt,
              session.user?.email || session.user?.name || "Unknown",
              updatedAt, // Created At
              "", // Notes
            ],
          ],
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isPTR
        ? "Marked as PTR successfully"
        : "Removed PTR successfully",
      isPTR,
    });
  } catch (error) {
    console.error("Error toggling PTR:", error);
    return NextResponse.json(
      { error: "Failed to toggle PTR" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Google Sheets API with OAuth2
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
      process.env.NEXTAUTH_URL
    );

    // Set credentials from session
    const credentials: any = {
      access_token: (session as any).accessToken,
    };

    if ((session as any).refreshToken) {
      credentials.refresh_token = (session as any).refreshToken;
    }

    oauth2Client.setCredentials(credentials);
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // Get PTR tracking data
    const ptrResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "PTR Tracking!A:L",
    });

    const rows = ptrResponse.data.values || [];
    if (rows.length <= 1) {
      return NextResponse.json({ ptrItems: [] });
    }

    const headers = rows[0];
    const ptrItems = rows
      .slice(1)
      .filter((row) => row[3] === "TRUE") // Only active PTRs
      .map((row) => {
        const ptrItem: any = {};
        headers.forEach((header, index) => {
          ptrItem[header.toLowerCase().replace(/\s+/g, "_")] = row[index] || "";
        });
        return ptrItem;
      });

    return NextResponse.json({ ptrItems });
  } catch (error) {
    console.error("Error fetching PTR items:", error);
    return NextResponse.json(
      { error: "Failed to fetch PTR items" },
      { status: 500 }
    );
  }
}
