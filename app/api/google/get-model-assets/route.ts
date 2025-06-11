import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const SPREADSHEET_ID = "1LPrht0Aobhs3KiRV0aLjmJ6_AKQ0HmANJohbzEsMEOk";
const SHEETS = ["Live Gen Tracker", "VIP Gen Tracker"];

// Utility to //initialize Google Sheets API client
async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Not authenticated");
  }

  if (!session.accessToken) {
    throw new Error("Not authenticated. No access token.");
  }

  console.log("🔐 Session tokens retrieved successfully");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined, // Convert seconds to milliseconds
  });

  return google.sheets({ version: "v4", auth: oauth2Client });
}

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const modelName = url.searchParams?.get("model")?.trim();

  console.log("🔍 Model name received:", modelName);

  if (!modelName) {
    return NextResponse.json(
      { error: "Model name is required" },
      { status: 400 }
    );
  }

  try {
    const sheets = await getSheetsClient();

    const allMatchingRows: Record<
      "live" | "vip",
      Record<string, string | { value: string; formula: string }>[]
    > = {
      live: [],
      vip: [],
    };

    for (const sheetName of SHEETS) {
      console.log(`📄 Fetching rows from: ${sheetName}`);

      const [valuesResponse, formulasResponse] = await Promise.all([
        sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A3:Z`, // Includes header row (row 3)
          valueRenderOption: "FORMATTED_VALUE",
        }),
        sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A3:Z`,
          valueRenderOption: "FORMULA",
        }),
      ]);

      const values = valuesResponse.data.values ?? [];
      const formulas = formulasResponse.data.values ?? [];

      if (values.length === 0) {
        console.log(`⚠️ No data in ${sheetName}`);
        continue;
      }

      const headers = values[0] as string[];
      const dataRows = values.slice(1); // Start from row 4 (data)
      const dataFormulas = formulas.slice(1); // Align with data

      const modelIndex = headers.indexOf("Model");

      if (modelIndex === -1) {
        console.warn(`❌ "Model" column not found in ${sheetName}`);
        continue;
      }

      const rows = dataRows
        .map((row, rowIndex) => {
          const modelCell = row[modelIndex]?.trim();
          if (
            !modelCell ||
            modelCell.toLowerCase() !== modelName.toLowerCase()
          ) {
            return null;
          }

          const rowObj: Record<
            string,
            string | { value: string; formula: string }
          > = {};

          headers.forEach((header, index) => {
            const value = row[index]?.trim() || "";
            const formula = dataFormulas[rowIndex]?.[index] || "";
            rowObj[header] =
              typeof formula === "string" && formula.startsWith("=")
                ? { value, formula }
                : value;
          });

          rowObj["type"] = sheetName.includes("VIP") ? "vip" : "live";
          rowObj["Sheet"] = sheetName;

          return rowObj;
        })
        .filter(Boolean) as Record<
        string,
        string | { value: string; formula: string }
      >[];

      console.log(`✅ Matching rows in ${sheetName}:`, rows.length);

      if (sheetName.includes("Live")) {
        allMatchingRows.live.push(...rows);
      } else if (sheetName.includes("VIP")) {
        allMatchingRows.vip.push(...rows);
      }
    }

    console.log("🧾 Final structured output:", allMatchingRows);
    return NextResponse.json(allMatchingRows, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ Error fetching model assets:", error);

    // Check for Google API permission errors (403)
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

    // Handle authentication errors
    if (
      error.message === "Not authenticated" ||
      error.message === "Not authenticated. No access token."
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch model assets" },
      { status: 500 }
    );
  }
}
