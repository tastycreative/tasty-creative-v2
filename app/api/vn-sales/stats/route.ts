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

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const spreadsheetId = "1_a08KImbkIA3z0_DTGWoqJdnRiw1y-kygj-Wr2cB_gk";

    console.log('📊 Fetching VN Sales stats...');

    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetNames = spreadsheetResponse.data.sheets?.map(sheet =>
      sheet.properties?.title
    ).filter(name => name && name !== 'Sheet1') || [];

    console.log('📋 Found sheets:', sheetNames);

    let totalSales = 0;
    let totalSalesToday = 0;
    const salesByModel: {
      [key: string]: { sales: number; revenue: number; loyaltyPoints: number };
    } = {};

    // Array to store individual sales records
    const recentSales: Array<{
      id: string;
      model: string;
      voiceNote: string;
      sale: number;
      soldDate: string;
      status: string;
      generatedDate: string;
      originalHistoryId?: string;
      submittedBy?: string;
      source?: string;
    }> = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    console.log('📅 Today range:', { todayStart, todayEnd });

    for (const sheetName of sheetNames) {
      if (!sheetName) continue;

      try {
        console.log(`📊 Processing sheet: ${sheetName}`);

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A:K`, // Extended to include new columns: ID, Model, Voice Note, Sale, Sold Date, Status, Generated Date, Original History ID, Submitted By, Source, Additional
        });

        const rows = response.data.values || [];
        const dataRows = rows.slice(1); // Skip header row

        console.log(`📈 Found ${dataRows.length} rows in ${sheetName}`);

        let modelSales = 0;
        let modelRevenue = 0;

        for (const row of dataRows) {
          if (row.length >= 4) { // At least ID, Model, Voice Note, Sale
            const id = row[0] || '';
            const model = row[1] || sheetName;
            const voiceNote = row[2] || '';
            const saleValue = row[3]; // row[3] = Sale column
            const soldDate = row[4] || ''; // row[4] = Sold Date column
            const status = row[5] || 'Completed'; // row[5] = Status column
            const generatedDate = row[6] || ''; // row[6] = Generated Date column
            const originalHistoryId = row[7] || ''; // row[7] = Original History ID column
            const submittedBy = row[8] || 'Unknown'; // row[8] = Submitted By column
            const source = row[9] || 'Unknown'; // row[9] = Source column

            // Parse sale value - handle both string and number formats
            let sale = 0;
            if (typeof saleValue === 'string') {
              // Remove any currency symbols and parse
              const cleanValue = saleValue.replace(/[$,]/g, '');
              sale = parseFloat(cleanValue) || 0;
            } else if (typeof saleValue === 'number') {
              sale = saleValue;
            }

            console.log(`💰 Processing sale: ${saleValue} -> ${sale} (${typeof saleValue})`);

            if (sale > 0) {
              modelSales++;
              modelRevenue += sale;
              totalSales++;

              // Add to recent sales array
              recentSales.push({
                id,
                model,
                voiceNote,
                sale,
                soldDate,
                status,
                generatedDate,
                originalHistoryId: originalHistoryId || undefined,
                submittedBy: submittedBy !== 'Unknown' ? submittedBy : undefined,
                source: source !== 'Unknown' ? source : undefined,
              });

              // Check if this sale was today
              if (soldDate) {
                try {
                  const saleDate = new Date(soldDate);
                  const isToday = saleDate >= todayStart && saleDate < todayEnd;

                  console.log(`📅 Sale date: ${soldDate} -> ${saleDate} (isToday: ${isToday})`);

                  if (isToday) {
                    totalSalesToday += sale;
                  }
                } catch (dateError) {
                  console.warn(`⚠️ Invalid date format: ${soldDate}`);
                }
              }
            }
          }
        }

        if (modelSales > 0) {
          salesByModel[sheetName] = {
            sales: modelSales,
            revenue: modelRevenue,
            loyaltyPoints: Math.floor(modelRevenue * 0.8),
          };

          console.log(`✅ ${sheetName}: ${modelSales} sales, $${modelRevenue.toFixed(2)} revenue`);
        }
      } catch (error) {
        console.error(`❌ Error fetching data from sheet ${sheetName}:`, error);
      }
    }

    // Sort recent sales by date (newest first)
    recentSales.sort((a, b) => new Date(b.soldDate).getTime() - new Date(a.soldDate).getTime());

    // Calculate totals
    let totalRevenue = 0;
    for (const model of Object.values(salesByModel)) {
      totalRevenue += model.revenue;
    }
    const averageVnPrice = totalSales > 0 ? totalRevenue / totalSales : 0;

    const result = {
      vnSalesToday: totalSalesToday,
      totalVnCount: totalSales,
      totalRevenue,
      averageVnPrice: Math.round(averageVnPrice * 100) / 100,
      salesByModel: Object.entries(salesByModel).map(([name, data]) => ({
        name,
        ...data,
      })),
      recentSales: recentSales.slice(0, 100), // Limit to last 100 sales for performance
      timestamp: new Date().toISOString(),
      debug: {
        sheetsProcessed: sheetNames.length,
        totalRowsProcessed: Object.values(salesByModel).reduce((sum, model) => sum + model.sales, 0),
        recentSalesCount: recentSales.length,
        todayDateRange: { todayStart, todayEnd }
      }
    };

    console.log('📊 Final VN Sales stats:', {
      ...result,
      recentSales: `${result.recentSales.length} sales loaded`
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("❌ Error fetching VN sales stats:", error);

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