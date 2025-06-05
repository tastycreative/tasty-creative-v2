import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET() {
  try {
    console.log("Starting GET request...");

    const session = await auth();

    if (!session || !session.user) {
      console.log("Not authenticated. No session or user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      console.log("Not authenticated. No access token found in session.");
      return NextResponse.json({ error: "Not authenticated. No access token." }, { status: 401 });
    }
    // It's also good practice to check for refreshToken if your OAuth flow provides it and it's essential for refreshing tokens.
    // Depending on the Google API client library behavior, a missing refresh token might not be an immediate issue
    // if the access token is still valid, but it will prevent refreshing the token later.
    // For now, we'll proceed if accessToken is present, assuming the library handles refresh token absence gracefully if not strictly needed for this call.

    console.log("Session retrieved:", session);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken, // session.refreshToken should be available if scoped correctly
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined, // Convert seconds to milliseconds
    });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const spreadsheetId = "1Ad_I-Eq11NWKT1jqPB9Bw6L1jVKBHHLqR4ZBLBT9XtU";
    const range = "Notifications!A2:G";
    console.log(`Fetching data from spreadsheetId: ${spreadsheetId}, range: ${range}`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    console.log("Fetched rows:", rows);

    if (!rows || rows.length === 0) {
      console.log("No notifications found.");
      return NextResponse.json({ message: "No notifications found" });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const notifications = rows
      .map((row) => ({
        timestamp: row[0],
        message: row[1],
        model: row[2],
        editedBy: row[3],
        row: row[4],
        sheet: row[5],
        editedData: row[6] ? JSON.parse(row[6]) : {},
      }))
      .filter((notif) => {
        const notifDate = new Date(notif.timestamp);
        const isValid = !isNaN(notifDate.getTime()) && notifDate >= oneWeekAgo;
        if (!isValid) {
          console.log(`Filtered out (too old or invalid date):`, notif.timestamp);
        }
        return isValid;
      });

    console.log("Filtered notifications (within 1 week):", notifications);

    return NextResponse.json({ notifications });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) { // Added :any to easily access error.code
    console.error("Error fetching notifications:", error);

    // Check if the error is from Google API and has a 403 status
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      // Log the specific Google error message for server-side diagnosis
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
      { message: "An unexpected error occurred while fetching notifications." },
      { status: 500 }
    );
  }
}
