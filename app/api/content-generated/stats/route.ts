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
            range: `'${sheetName}'!A1:Z100`, // Get more data to find TOTAL row
          });

          const rows = response.data.values || [];

          // Find the row that contains "TOTAL" in column C (MODEL column - index 2)
          const totalRow = rows.find(row => 
            row[2] && row[2].toString().toUpperCase().includes('TOTAL')
          );

          if (totalRow && totalRow.length > 3) {
            const totalValue = totalRow[3]; // Files column D (index 3)
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

    // Fetch recent activity from all sheets
    const recentActivities: any[] = [];
    
    for (const sheetName of sheetNames) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${sheetName}'!A1:Z50`, // Get first 50 rows to find recent activities
        });

        const rows = response.data.values || [];
        
        // Find the "Created By" column index in row 3 (index 2)
        const headerRow = rows[2] || []; // Row 3 is index 2
        const createdByIndex = headerRow.findIndex((header: string) => 
          header && header.toString().toLowerCase().includes('created by')
        );
        
        // If not found in row 3, check if it's specifically in column G (index 6)
        const finalCreatedByIndex = createdByIndex !== -1 ? createdByIndex : 6; // Column G is index 6
        
        if (finalCreatedByIndex !== -1) {
          // Get recent entries (skip first 3 rows which are headers and get up to 10 most recent)
          const dataRows = rows.slice(3, 13); // Start from row 4 (index 3)
          
          for (const row of dataRows) {
            if (row[finalCreatedByIndex] && row[finalCreatedByIndex].toString().trim()) {
              const createdByValue = row[finalCreatedByIndex].toString();
              
              // Parse the created by value
              let name = '';
              let email = '';
              
              if (sheetName === 'AI Gen Tracker') {
                // Format: txl.tasty (txl.tasty@gmail.com)
                const match = createdByValue.match(/^(.+?)\s*\((.+?)\)$/);
                if (match) {
                  name = match[1].trim();
                  email = match[2].trim();
                }
              } else {
                // Format: Fatie Diongzon <fatimadiongzon5@gmail.com>
                const match = createdByValue.match(/^(.+?)\s*<(.+?)>$/);
                if (match) {
                  name = match[1].trim();
                  email = match[2].trim();
                }
              }
              
              if (name && email) {
                recentActivities.push({
                  tracker: sheetName,
                  name,
                  email,
                  createdAt: new Date().toISOString(), // Using current time as placeholder
                  activity: `Generated content in ${sheetName}`
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching recent activity from ${sheetName}:`, error);
      }
    }
    
    // Sort by most recent and limit to 10
    const sortedActivities = recentActivities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return NextResponse.json({
      totalContentGenerated,
      contentGeneratedToday,
      contentGrowth: Math.floor(Math.random() * 20) + 5, // Mock growth percentage
      contentByTracker: Object.entries(contentByTracker).map(([name, count]) => ({
        tracker: name,
        count
      })),
      recentActivities: sortedActivities
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