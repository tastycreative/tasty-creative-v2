import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

// Function to extract spreadsheet ID from URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
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

    const { sheetUrl } = await request.json();

    if (!sheetUrl) {
      return NextResponse.json(
        { error: "Sheet URL is required" },
        { status: 400 }
      );
    }

    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Invalid Google Sheets URL" },
        { status: 400 }
      );
    }

    // Use the user's OAuth credentials instead of server API key
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

    try {
      // Fetch sheet metadata using user's credentials
      const response = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "properties.title",
      });

      const sheetName = response.data.properties?.title;

      if (!sheetName) {
        return NextResponse.json(
          { error: "Could not retrieve sheet name" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        sheetName,
        spreadsheetId,
      });
    } catch (googleError: any) {
      console.error("Google Sheets API error:", googleError);

      if (googleError.code === 403) {
        return NextResponse.json(
          {
            error:
              "Access denied to this spreadsheet. Please check permissions or ensure the sheet is shared with you.",
          },
          { status: 403 }
        );
      } else if (googleError.code === 404) {
        return NextResponse.json(
          { error: "Spreadsheet not found or is private." },
          { status: 404 }
        );
      } else if (googleError.code === 401) {
        return NextResponse.json(
          { error: "GoogleAuthExpired" }, // This matches the error handling in SheetsIntegration
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          { error: "Failed to fetch sheet information" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error fetching sheet name:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
