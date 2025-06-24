
import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_SWD_ID || "your-spreadsheet-id-here";

// Utility to initialize Google Sheets API client
async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Not authenticated");
  }

  if (!session.accessToken) {
    throw new Error("Not authenticated. No access token.");
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

  return google.sheets({ version: "v4", auth: oauth2Client });
}

export async function GET(): Promise<NextResponse> {
  try {
    const sheets = await getSheetsClient();

    // Fetch model data (adjust ranges based on your actual spreadsheet structure)
    const modelDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "ModelData!A2:G50", // Adjust range as needed
    });

    const bestScriptsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "BestScripts!A2:D20", // Adjust range as needed
    });

    const leaderboardResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Leaderboard!A2:Z100", // Adjust range as needed
    });

    // Process model data
    const modelData = (modelDataResponse.data.values || []).map((row: any[]) => ({
      creator: row[0] || '',
      totalSets: parseInt(row[1]) || 0,
      totalScripts: parseInt(row[2]) || 0,
      personalityType: row[3] || '',
      commonTerms: row[4] || '',
      commonEmojis: row[5] || '',
      restrictedTerms: row[6] || ''
    }));

    // Process best scripts data
    const bestScriptsRows = bestScriptsResponse.data.values || [];
    const bestScripts = {
      bestSeller: bestScriptsRows
        .filter((row: any[]) => row[0] && row[1]) // Filter rows with both title and buy amount
        .map((row: any[]) => ({
          title: row[0] || '',
          totalBuy: row[1] || '',
          totalSend: 0
        })),
      topSent: bestScriptsRows
        .filter((row: any[]) => row[2] && row[3]) // Filter rows with both title and send amount
        .map((row: any[]) => ({
          title: row[2] || '',
          totalBuy: '',
          totalSend: parseInt(row[3]) || 0
        }))
    };

    // Process leaderboard data (this will need to be adjusted based on your actual sheet structure)
    const leaderboardRows = leaderboardResponse.data.values || [];
    
    // Sample data structure - adjust based on your actual spreadsheet layout
    const leaderboard = {
      totalSend: [
        { creator: "Alanna", amount: 0, rank: 0 },
        { creator: "Alanna", amount: 0, rank: 1 },
        { creator: "Alanna", amount: 0, rank: 2 },
        { creator: "Alanna", amount: 0, rank: 3 },
        { creator: "Alanna", amount: 0, rank: 4 }
      ],
      totalBuy: [
        { creator: "Sharna", amount: "$10,817", rank: 0 },
        { creator: "Alanna", amount: "$0", rank: 1 },
        { creator: "Alanna", amount: "$0", rank: 2 },
        { creator: "Alanna", amount: "$0", rank: 3 },
        { creator: "Alanna", amount: "$0", rank: 4 }
      ],
      zeroSet: ["Fandy", "Kei", "Koaty and Summer", "Lolo", "Rocky"],
      zeroScript: [
        "Alanna", "Ali Patience", "Aspen", "Fandy", "Grace", "Hailey",
        "Jade Bri", "Julianna", "Kei", "Kelly", "Kiki", "Koaty and Summer",
        "Laila", "Lolo", "Madison", "Marcie", "Mathilde", "Mia Swan",
        "Natalie R", "Razz", "Rocky", "Ry", "Sinatra", "Stasia",
        "Swiggy", "Tara West", "Tayy", "Victoria Lit", "Zoey"
      ],
      highestSet: [
        { creator: "Kenzie", amount: 167, rank: 0 },
        { creator: "Nicole Aniston", amount: 104, rank: 1 },
        { creator: "Autumn", amount: 95, rank: 2 },
        { creator: "Lala", amount: 90, rank: 3 },
        { creator: "Victoria Lit", amount: 74, rank: 4 }
      ],
      lowestSet: [
        { creator: "Mathilde", amount: 2, rank: 4 },
        { creator: "Mathilde", amount: 2, rank: 3 },
        { creator: "Hailey", amount: 3, rank: 2 },
        { creator: "Hailey", amount: 3, rank: 1 },
        { creator: "Hailey", amount: 3, rank: 0 }
      ],
      highestScript: [
        { creator: "Bri", amount: 19, rank: 0 },
        { creator: "Dan Dangler", amount: 15, rank: 1 },
        { creator: "Autumn", amount: 12, rank: 2 },
        { creator: "Coco", amount: 10, rank: 3 },
        { creator: "Coco", amount: 10, rank: 4 }
      ],
      lowestScript: [
        { creator: "Charlotte P", amount: 1, rank: 4 },
        { creator: "Charlotte P", amount: 1, rank: 3 },
        { creator: "Charlotte P", amount: 1, rank: 2 },
        { creator: "Charlotte P", amount: 1, rank: 1 },
        { creator: "Charlotte P", amount: 1, rank: 0 }
      ]
    };

    const response = {
      modelData,
      bestScripts,
      leaderboard
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Error fetching SWD data from Google Sheets:", error);

    // Handle Google API permission errors specifically
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the Google Sheet."}`,
        },
        { status: 403 }
      );
    }

    // Handle authentication errors
    if (
      error.message === "Not authenticated" ||
      error.message === "Not authenticated. No access token."
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch SWD data from Google Sheets", details: error.message },
      { status: 500 }
    );
  }
}
