
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!session.accessToken) {
      return NextResponse.json(
        { error: "No access token available" },
        { status: 401 }
      );
    }

    // Set up OAuth2 client with Auth.js session tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken || undefined,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    // Initialize the Google Sheets API
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const spreadsheetId = "1LPrht0Aobhs3KiRV0aLjmJ6_AKQ0HmANJohbzEsMEOk";

    // Sheet names to check
    const sheetNames = ['VIP Gen Tracker', 'Live Gen Tracker', 'FTT Gen Tracker', 'AI Gen Tracker'];
    
    let totalContentGenerated = 0;
    let contentGeneratedToday = 0;
    const contentByTracker: { [key: string]: number } = {};
    const today = new Date().toLocaleDateString();

    // Fetch data from each tracker sheet
    for (const sheetName of sheetNames) {
      try {
        // For AI Gen Tracker, find the TOTAL row in the data
        if (sheetName === 'AI Gen Tracker') {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A1:Z100`, // Get more data to find TOTAL row
          });

          const rows = response.data.values || [];
          
          // Find the row that contains "TOTAL" in the first column
          const totalRow = rows.find(row => 
            row[0] && row[0].toString().toUpperCase().includes('TOTAL')
          );
          
          if (totalRow && totalRow.length > 1) {
            const totalValue = totalRow[1]; // Files column (second column)
            if (totalValue && !isNaN(Number(totalValue))) {
              const count = Number(totalValue);
              totalContentGenerated += count;
              contentByTracker[sheetName] = count;
            }
          }
        } else {
          // For other trackers, start from B4 onwards
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!B4:Z1000`, // Get data starting from B4
          });

          const rows = response.data.values || [];
          let sheetCount = 0;

          rows.forEach((row) => {
            // Count non-empty cells that might indicate content generation
            const nonEmptyCells = row.filter(cell => cell && cell.toString().trim() !== '').length;
            if (nonEmptyCells > 0) {
              sheetCount++;
            }
          });

          totalContentGenerated += sheetCount;
          contentByTracker[sheetName] = sheetCount;
        }
      } catch (error) {
        console.error(`Error fetching data from ${sheetName}:`, error);
        // Continue with other sheets if one fails
        contentByTracker[sheetName] = 0;
      }
    }

    // Calculate today's content (simplified - you may want to add date filtering)
    contentGeneratedToday = Math.floor(totalContentGenerated * 0.1); // Mock calculation

    return NextResponse.json({
      totalContentGenerated,
      contentGeneratedToday,
      contentGrowth: Math.floor(Math.random() * 20) + 5, // Mock growth percentage
      contentByTracker: Object.entries(contentByTracker).map(([name, count]) => ({
        tracker: name,
        count
      }))
    });

  } catch (error: any) {
    console.error("Error fetching content generation stats:", error);

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

    return NextResponse.json(
      {
        error: "Failed to fetch content generation stats",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
