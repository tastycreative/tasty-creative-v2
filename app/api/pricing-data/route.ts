// app/api/pricing-data/route.js
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

const SHEET_ID = '1J2csF1QY8V90B3IW1I_sEZL2JXBXYzCyrykIDfvdAdk';

async function fetchWithRetry(sheets, spreadsheetId, ranges, retryCount = 0) {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  try {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetId,
      ranges: ranges,
    });
    return response;
  } catch (error) {
    // Check if it's a quota exceeded error (429)
    if (error.code === 429 && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s, 4s
      console.log(`Quota exceeded, retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(sheets, spreadsheetId, ranges, retryCount + 1);
    }
    
    // If it's not a quota error or we've exhausted retries, rethrow
    throw error;
  }
}

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

    // Fetch all data in just 2 large ranges to minimize API calls (no need for group headers)
    const ranges = [
      'A1:AB1',   // Headers row (all columns from A to AB)
      'A2:AB',    // All data from row 2 onwards (all columns from A to AB)
    ];

    // Fetch the required ranges with retry logic
    const response = await fetchWithRetry(sheets, SHEET_ID, ranges);

    const [headersRange, dataRange] = response.data.valueRanges;

    const headersRow = headersRange.values?.[0] || [];
    const allDataRows = dataRange.values || [];

    // Extract client names from column A (first column of data rows)
    const clientNames = allDataRows.map(row => row[0]).filter(Boolean);

    // Create creators list with row numbers (adding 2 because row 1 is headers and arrays are 0-indexed)
    const creators = clientNames.map((clientName, clientIndex) => ({
      id: `creator-${clientIndex}`,
      name: clientName.trim(),
      specialty: 'Content Creator',
      rowNumber: clientIndex + 2, // Row number in the actual sheet (accounting for header row)
    }));

    // Helper function to create a pricing group from ranges
    const createPricingGroup = (groupId, groupName, itemStartCol, itemEndCol) => {
      // Extract item names from headers row (convert column letters to indices)
      const itemNames = headersRow.slice(itemStartCol - 1, itemEndCol).filter(Boolean);
      
      // Create items
      const items = itemNames.map((itemName, itemIndex) => {
        if (!itemName || !itemName.trim()) return null;
        return {
          id: `${groupId}-item-${itemIndex}`,
          name: itemName.trim(),
          description: '',
        };
      }).filter(Boolean);

      // Map pricing data for each client/creator
      const creatorPricingMap = {};
      clientNames.forEach((clientName, clientIndex) => {
        if (clientName && clientName.trim()) {
          const trimmedName = clientName.trim();
          const creatorRow = allDataRows[clientIndex];
          
          if (creatorRow) {
            creatorPricingMap[trimmedName] = {};
            
            // Map each item's price for this creator
            itemNames.forEach((itemName, itemIndex) => {
              if (itemName && itemName.trim()) {
                const priceColumnIndex = (itemStartCol - 1) + itemIndex;
                const price = creatorRow[priceColumnIndex];
                if (price && price.trim()) {
                  creatorPricingMap[trimmedName][itemName.trim()] = price.trim();
                }
              }
            });
          }
        }
      });

      return {
        id: groupId,
        groupName: groupName,
        items: items,
        pricing: creatorPricingMap,
      };
    };

    // Create all three pricing groups with static names and their respective column ranges
    // Group 1: C-Q (columns 3-17), Group 2: S-T (columns 19-20), Group 3: V-AB (columns 22-28)
    const pricingGroups = [
      createPricingGroup('group-1', 'Content Price Ranges', 3, 17),  // C-Q is cols 3-17
      createPricingGroup('group-2', 'Custom Content', 19, 20),       // S-T is cols 19-20  
      createPricingGroup('group-3', 'Bundle Contents', 22, 28),      // V-AB is cols 22-28
    ];

    return NextResponse.json({
      pricingData: pricingGroups,
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