import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

// Function to extract spreadsheet ID from Google Sheets URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    // Try different authentication methods
    let sheets;

    // First, try with API key for public spreadsheets
    if (process.env.AUTH_API_KEY) {
      console.log("Trying API key authentication for creator data");
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

      console.log("Using session-based authentication for creator data");
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

    try {
      // Fetch data from C6:I50 range
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "C6:I50",
      });

      const values = response.data.values || [];
      console.log("Raw data from C6:I50:", values);

      // Parse the creator data structure
      const creatorData = parseCreatorData(values);

      console.log(`Successfully fetched creator data`);
      return NextResponse.json({
        massMessages: creatorData.massMessages,
        wallPosts: creatorData.wallPosts,
      });
    } catch (sheetsError) {
      console.error(
        "Error fetching creator data from Google Sheets:",
        sheetsError
      );

      // If API key failed and we haven't tried OAuth yet, try OAuth
      if (process.env.AUTH_API_KEY && !sheets.auth.credentials) {
        console.log(
          "API key authentication failed for creator, trying OAuth..."
        );

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
              spreadsheetId,
              range: "C6:I50",
            });

            const values = oauthResponse.data.values || [];
            const creatorData = parseCreatorData(values);

            console.log(`OAuth fallback successful for creator data`);
            return NextResponse.json({
              massMessages: creatorData.massMessages,
              wallPosts: creatorData.wallPosts,
            });
          }
        } catch (oauthError) {
          console.error("OAuth fallback also failed for creator:", oauthError);
        }
      }

      return NextResponse.json(
        { error: "Failed to access Google Sheets. Please check permissions." },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error fetching creator data:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator data" },
      { status: 500 }
    );
  }
}

function parseCreatorData(values: string[][]): {
  massMessages: Array<{ text: string; checker: string }>;
  wallPosts: Array<{ text: string; checker: string }>;
} {
  const massMessages: Array<{ text: string; checker: string }> = [];
  const wallPosts: Array<{ text: string; checker: string }> = [];

  if (!values || values.length === 0) {
    return { massMessages, wallPosts };
  }

  console.log("Parsing creator data from values:", values.length, "rows");

  // Data starts from row 17 in the original sheet, which is index 11 in our C6:I50 range (17-6=11)
  const dataStartIndex = 11; // Row 17 - Row 6 = 11

  for (let i = dataStartIndex; i < values.length; i++) {
    const row = values[i];

    if (!row || row.length === 0) {
      continue; // Skip empty rows
    }

    // Extract Mass Messages data (C17:F50 merged cells with checker G17:G50)
    // Check columns C through F for merged cell content
    const massMessageText = (row[0] || row[1] || row[2] || row[3] || "").trim(); // Columns C-F (indices 0-3)
    const massMessageChecker = row[4] ? row[4].trim() : ""; // Column G (index 4)

    if (massMessageText && massMessageText !== "") {
      massMessages.push({
        text: massMessageText,
        checker: massMessageChecker,
      });
    }

    // Extract Wall Posts data (H17:H50 with checker I17:I50)
    const wallPostText = row[5] ? row[5].trim() : ""; // Column H (index 5)
    const wallPostChecker = row[6] ? row[6].trim() : ""; // Column I (index 6)

    if (wallPostText && wallPostText !== "") {
      wallPosts.push({
        text: wallPostText,
        checker: wallPostChecker,
      });
    }
  }

  console.log("Final parsed creator data:");
  console.log("Mass messages:", massMessages.length);
  console.log("Wall posts:", wallPosts.length);

  return { massMessages, wallPosts };
}
