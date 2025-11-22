import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET() {
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
      process.env.NEXTAUTH_URL
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const spreadsheetId = "1hmC08YXrDygHzQiMd-33MJBT26QEoSaBnvvMozsIop0";

    // Fetch data from the Requests sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Requests!A:F", // Getting all columns A through F
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    // Skip header row and process data
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const requests = dataRows.map((row) => {
      const request: any = {};

      // Map each column to the corresponding field
      headers.forEach((header: string, index: number) => {
        const value = index < row.length ? row[index] || "" : "";

        // Map headers to expected field names
        switch (header.toLowerCase()) {
          case "timestamp":
            request.timestamp = value;
            break;
          case "user":
            request.user = value;
            break;
          case "requestedby":
            request.requestedBy = value;
            break;
          case "model":
            request.model = value;
            break;
          case "sextingset":
            request.sextingSet = value;
            break;
          case "specialrequest":
            request.specialRequest = value;
            break;
          default:
            // Handle any additional fields
            request[header] = value;
        }
      });

      return request;
    });

    // Sort by timestamp (most recent first)
    requests.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("Error fetching requests data:", error);

    // Handle Google API permission errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the Google Sheet."}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch requests data", details: error.message },
      { status: 500 }
    );
  }
}
