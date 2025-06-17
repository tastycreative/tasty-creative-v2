import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Optional: Add role-based access control
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Set up OAuth2 client with Auth.js session tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Check if we have the necessary tokens
    if (!session.accessToken) {
      return NextResponse.json(
        {
          error: "No access token available. Please re-authenticate with Google.",
        },
        { status: 401 }
      );
    }

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken || undefined,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    // Check if token is expired and we need to refresh
    if (
      !session.refreshToken &&
      session.expiresAt &&
      new Date().getTime() > session.expiresAt * 1000
    ) {
      return NextResponse.json(
        {
          error: "Access token expired and no refresh token available. Please re-authenticate with Google.",
        },
        { status: 401 }
      );
    }

    // Initialize the Google Sheets API
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const spreadsheetId = "1_a08KImbkIA3z0_DTGWoqJdnRiw1y-kygj-Wr2cB_gk";

    // Get all sheet names first
    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetNames = spreadsheetResponse.data.sheets?.map(sheet => 
      sheet.properties?.title
    ).filter(name => name && name !== 'Sheet1') || [];

    let totalSales = 0;
    let totalSalesToday = 0;
    const salesByModel: { [key: string]: { sales: number; revenue: number; loyaltyPoints: number } } = {};
    const today = new Date().toLocaleDateString();

    // Fetch data from each model sheet
    for (const sheetName of sheetNames) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A:E`, // Voice Note, Sale, Sold Date, Status, Total
        });

        const rows = response.data.values || [];
        
        // Skip header row
        const dataRows = rows.slice(1);
        
        let modelSales = 0;
        let modelRevenue = 0;
        let modelSalesToday = 0;

        for (const row of dataRows) {
          if (row.length >= 3) {
            const sale = parseFloat(row[1]) || 0;
            const soldDate = row[2];
            
            if (sale > 0) {
              modelSales++;
              modelRevenue += sale;
              totalSales++;
              
              // Check if sale is from today
              if (soldDate && new Date(soldDate).toLocaleDateString() === today) {
                modelSalesToday++;
                totalSalesToday += sale;
              }
            }
          }
        }

        if (modelSales > 0) {
          salesByModel[sheetName] = {
            sales: modelSales,
            revenue: modelRevenue,
            loyaltyPoints: Math.floor(modelRevenue * 0.8) // Assume 0.8 loyalty points per dollar
          };
        }
      } catch (error) {
        console.error(`Error fetching data from sheet ${sheetName}:`, error);
      }
    }

    // Calculate average VN price
    let totalRevenue = 0;
    for (const model of Object.values(salesByModel)) {
      totalRevenue += model.revenue;
    }
    const averageVnPrice = totalSales > 0 ? totalRevenue / totalSales : 0;

    return NextResponse.json({
      vnSalesToday: totalSalesToday,
      totalVnCount: totalSales,
      totalRevenue,
      averageVnPrice: Math.round(averageVnPrice * 100) / 100,
      salesByModel: Object.entries(salesByModel).map(([name, data]) => ({
        name,
        ...data
      }))
    });

  } catch (error: any) {
    console.error("Error fetching VN sales stats:", error);

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
        error: "Failed to fetch VN sales stats",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}