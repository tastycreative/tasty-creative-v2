import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

// Type definitions
interface ModelData {
  creator: string;
  totalSets: number;
  totalScripts: number;
  personalityType: string;
  commonTerms: string;
  commonEmojis: string;
  restrictedTerms: string;
}

interface SendBuyData {
  creator: string;
  month: string;
  dateUpdated: string;
  scriptTitle: string;
  scriptLink: string;
  totalSend: number;
  totalBuy: number;
}

interface ApiResponse {
  modelData: ModelData[];
  sendBuyData: SendBuyData[];
  availableCreators: string[];
  availableMonths: string[];
}

export async function GET(): Promise<
  NextResponse<
    ApiResponse | { error: string; message?: string; details?: string }
  >
> {
  try {
    // Get session and authenticate
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

    // Setup OAuth2 client
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
    const spreadsheetId = "1hmC08YXrDygHzQiMd-33MJBT26QEoSaBnvvMozsIop0";

    // Fetch Client Database data (start from row 3 since headers are in row 2)
    const clientResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Client Database!A3:H",
    });
    const clientRows: string[][] = clientResponse.data.values || [];

    // Fetch Send+Buy Input data (start from row 3 since headers are in row 2)
    const sendBuyResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Send+Buy Input!B3:H",
    });
    const sendBuyRows: string[][] = sendBuyResponse.data.values || [];

    // Process model data from Client Database
    const modelData: ModelData[] = clientRows
      .map((row: string[]) => ({
        creator: row[1] || "", // Creator (column B)
        totalSets: parseInt(row[2]) || 0, // Total sets (column C)
        totalScripts: parseInt(row[3]) || 0, // Total Scripts (column D)
        personalityType: row[4] || "", // Personality Type (column E)
        commonTerms: row[5] || "", // Common Terms (column F)
        commonEmojis: row[6] || "", // Common Emojis (column G)
        restrictedTerms: row[7] || "", // Restricted Terms or Emojis (column H)
      }))
      .filter(
        (model: ModelData) => model.creator && model.creator.trim() !== ""
      );

    // Process Send+Buy data
    const sendBuyData: SendBuyData[] = sendBuyRows
      .map((row: string[]) => {
        // Clean and parse totalSend (remove commas)
        const totalSendStr = row[5] || "0";
        const totalSend = parseInt(totalSendStr.replace(/,/g, "")) || 0;

        // Clean and parse totalBuy (remove $ and commas, handle both $ prefix and suffix)
        const totalBuyStr = row[6] || "0";
        const cleanedBuy = totalBuyStr.replace(/[$,\s]/g, ""); // Remove $, commas, and spaces
        const totalBuy = parseFloat(cleanedBuy) || 0;

        return {
          creator: row[0] || "",
          month: row[1] || "",
          dateUpdated: row[2] || "",
          scriptTitle: row[3] || "",
          scriptLink: row[4] || "",
          totalSend: totalSend,
          totalBuy: totalBuy,
        };
      })
      .filter(
        (item: SendBuyData) => item.creator && item.creator.trim() !== ""
      );

    // Get unique creators and months for dropdowns
    const availableCreators: string[] = [
      ...new Set(modelData.map((m: ModelData) => m.creator)),
    ].sort();
    const availableMonths: string[] = [
      ...new Set(sendBuyData.map((s: SendBuyData) => s.month)),
    ]
      .filter((m: string) => m)
      .sort();

    const response: ApiResponse = {
      modelData,
      sendBuyData,
      availableCreators,
      availableMonths,
    };

    return NextResponse.json(response);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching SWD data:", error);

    // Handle Google API permission errors
    if (error.code === 403 && error.errors && error.errors.length > 0) {
      console.error(
        "Google API Permission Error (403):",
        error.errors[0].message
      );
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message || "The authenticated Google account does not have permission for the Google Sheet."}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch SWD data", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();

    const {
      creator,
      month,
      dateUpdated,
      scriptTitle,
      scriptLink,
      totalSend,
      totalBuy,
    } = body;

    // Validate required fields
    if (!creator || !month || !dateUpdated || !scriptTitle || !scriptLink) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
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
    const spreadsheetId = "1hmC08YXrDygHzQiMd-33MJBT26QEoSaBnvvMozsIop0";

    // Append the new row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Send+Buy Input!A3:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            "",
            creator,
            month,
            dateUpdated,
            scriptTitle,
            scriptLink,
            totalSend,
            totalBuy,
          ],
        ],
      },
    });

    return NextResponse.json({ message: "Row added successfully." });
  } catch (error: any) {
    console.error("Error adding data to Send+Buy Input sheet:", error);

    if (error.code === 403 && error.errors && error.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GooglePermissionDenied",
          message: `Google API Error: ${error.errors[0].message}`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add row", details: error.message },
      { status: 500 }
    );
  }
}
