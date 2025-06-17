
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Check if we have the required environment variables
    if (!process.env.AUTH_SECRET) {
      return NextResponse.json(
        { error: "Missing AUTH_SECRET environment variable" },
        { status: 500 }
      );
    }

    // Create service account credentials using AUTH_SECRET as the private key
    const credentials = {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.AUTH_SECRET.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`
    };

    // Set up Google Auth with service account
    const auth_client = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    // Initialize the Google Sheets API
    const sheets = google.sheets({ version: "v4", auth: auth_client });

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
    return NextResponse.json(
      { error: "Failed to fetch VN sales stats" },
      { status: 500 }
    );
  }
}
