import { NextRequest, NextResponse } from 'next/server';

// Function to extract spreadsheet ID from URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const { sheetUrl } = await request.json();
    
    if (!sheetUrl) {
      return NextResponse.json(
        { error: 'Sheet URL is required' },
        { status: 400 }
      );
    }

    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Invalid Google Sheets URL' },
        { status: 400 }
      );
    }

    // Use the server-side Google API key
    const apiKey = process.env.AUTH_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Fetch sheet metadata from Google Sheets API
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}&fields=properties.title`
    );

    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Access denied to this spreadsheet. Please check permissions.' },
          { status: 403 }
        );
      } else if (response.status === 404) {
        return NextResponse.json(
          { error: 'Spreadsheet not found or is private.' },
          { status: 404 }
        );
      } else {
        return NextResponse.json(
          { error: 'Failed to fetch sheet information' },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    const sheetName = data.properties?.title;

    if (!sheetName) {
      return NextResponse.json(
        { error: 'Could not retrieve sheet name' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sheetName,
      spreadsheetId
    });

  } catch (error) {
    console.error('Error fetching sheet name:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
