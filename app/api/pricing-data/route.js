// app/api/pricing-data/route.js
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

const SHEET_ID = '1J2csF1QY8V90B3IW1I_sEZL2JXBXYzCyrykIDfvdAdk';

export async function GET() {
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

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Fetch the required ranges
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges: [
        'C1:Q1',    // Item names (row 1, columns C to Q)
        'B2',       // Service group header (B2)
        'A2:A',     // Client names (column A from row 2 onwards)
        'C2:Q',     // All pricing data from row 2 onwards (columns C to Q)
      ],
    });

    const [itemNamesRange, headerRange, creatorNamesRange, pricingDataRange] = response.data.valueRanges;

    // Extract data
    const itemNames = itemNamesRange.values?.[0] || [];
    const groupHeader = headerRange.values?.[0]?.[0] || 'Services';
    const clientNames = creatorNamesRange.values?.map(row => row[0]).filter(Boolean) || [];
    const pricingRows = pricingDataRange.values || [];

    // Create items from the item names with individual pricing per creator
    const items = itemNames.map((itemName, itemIndex) => {
      if (!itemName || !itemName.trim()) return null;

      return {
        id: `item-${itemIndex}`,
        name: itemName.trim(),
        description: '',
        // Individual pricing for each creator for this specific item
        pricing: {}
      };
    }).filter(Boolean);

    // Map pricing data for each client/creator
    const creators = [];
    const creatorPricingMap = {}; // Map creator name to their pricing for all items

    clientNames.forEach((clientName, clientIndex) => {
      if (clientName && clientName.trim()) {
        const trimmedName = clientName.trim();
        const creatorPricingRow = pricingRows[clientIndex]; // clientIndex matches the row in pricingRows
        
        if (creatorPricingRow) {
          creators.push({
            id: `creator-${clientIndex}`,
            name: trimmedName,
            specialty: 'Content Creator',
          });

          creatorPricingMap[trimmedName] = {};

          // Map each item's price for this creator
          itemNames.forEach((itemName, itemIndex) => {
            if (itemName && itemName.trim()) {
              const price = creatorPricingRow[itemIndex]; // Direct mapping: itemIndex to column index
              if (price && price.trim()) {
                creatorPricingMap[trimmedName][itemName.trim()] = price.trim();
              }
            }
          });
        }
      }
    });

    // Create the pricing group structure with individual item pricing
    const pricingGroup = {
      id: 'google-sheets-data',
      groupName: groupHeader,
      items: items,
      pricing: creatorPricingMap, // Now contains item-specific pricing
    };

    return NextResponse.json({
      pricingData: [pricingGroup],
      creators: creators,
    });

  } catch (error) {
    console.error('Error fetching pricing data from Google Sheets:', error);

    // Check if the error is from Google API and has a 403 status
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

    // For other types of errors, return a generic 500
    return NextResponse.json(
      { error: "Failed to fetch pricing data from Google Sheets" },
      { status: 500 }
    );
  }
}