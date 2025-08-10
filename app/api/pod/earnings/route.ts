import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

// Extract spreadsheet ID and GID from URL
function extractSpreadsheetInfo(url: string): { spreadsheetId: string | null, gid: string | null } {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = url.match(/[#&]gid=([0-9]+)/);
  return {
    spreadsheetId: match ? match[1] : null,
    gid: gidMatch ? gidMatch[1] : null
  };
}

export async function POST(request: NextRequest) {
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

    const { spreadsheetUrl, creatorNames } = await request.json();

    if (!spreadsheetUrl || !creatorNames || !Array.isArray(creatorNames)) {
      return NextResponse.json(
        { error: 'Spreadsheet URL and creator names array are required' },
        { status: 400 }
      );
    }

    // Extract spreadsheet ID and GID from URL
    const { spreadsheetId, gid } = extractSpreadsheetInfo(spreadsheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Invalid Google Sheets URL format' },
        { status: 400 }
      );
    }

    // Get sheet information if GID is provided
    let sheetName = 'Sheet1'; // Default sheet name
    if (gid) {
      try {
        const spreadsheetInfo = await sheets.spreadsheets.get({
          spreadsheetId,
        });
        
        const sheet = spreadsheetInfo.data.sheets?.find(
          s => s.properties?.sheetId?.toString() === gid
        );
        
        if (sheet && sheet.properties?.title) {
          sheetName = sheet.properties.title;
        }
      } catch (error) {
        console.error('Error getting sheet info:', error);
        // Continue with default sheet name if this fails
      }
    }

    // Fetch names from column E and earnings from column H
    const range = `${sheetName}!E2:H100`; // Extended range to cover more rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    const creatorEarnings: { [key: string]: string } = {};
    const debugInfo = {
      totalRows: rows.length,
      creatorNames,
      foundNames: [] as string[],
      allNamesInSheet: [] as string[]
    };

    // Process each row to find matching creator names
    rows.forEach((row) => {
      const name = row[0]?.trim(); // Column E (index 0 in our range)
      const earnings = row[3]?.trim(); // Column H (index 3 in our range)
      
      if (name) {
        debugInfo.allNamesInSheet.push(name);
      }
      
      if (name && earnings) {
        // Check if this name matches any of our creators
        const matchingCreator = creatorNames.find((creatorName: string) => 
          creatorName.toLowerCase().trim() === name.toLowerCase().trim()
        );
        
        if (matchingCreator) {
          creatorEarnings[matchingCreator] = earnings;
          debugInfo.foundNames.push(name);
        }
      }
    });

    return NextResponse.json({
      success: true,
      earnings: creatorEarnings,
      debug: debugInfo, // Include debug info to help troubleshoot
    });

  } catch (error) {
    console.error('Error fetching creator earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creator earnings data' },
      { status: 500 }
    );
  }
}
