import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

// Function to extract spreadsheet ID from Google Sheets URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
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

    const { sheetUrl } = await request.json();

    if (!sheetUrl) {
      return NextResponse.json({ error: 'Sheet URL is required' }, { status: 400 });
    }

    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Invalid Google Sheets URL' }, { status: 400 });
    }

    // Fetch data from C6:I range to get Type and Status headers and values
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'C6:I',
    });

    const values = response.data.values || [];
    console.log('Raw data from C6:I:', values);

    // Parse the data structure
    const scheduleData = parseScheduleData(values);

    return NextResponse.json({ scheduleData });

  } catch (error) {
    console.error('Error fetching schedule data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule data' },
      { status: 500 }
    );
  }
}

function parseScheduleData(values: string[][]) {
  const scheduleData: Array<{
    type: string;
    status: string;
    type2?: string;
    status2?: string;
  }> = [];

  if (values.length < 2) {
    return scheduleData;
  }

  // Find header rows - look for "Type:" and "Status:"
  let headerRowIndex = -1;
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (row.some(cell => cell && cell.toLowerCase().includes('type:'))) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.log('No Type: header found');
    return scheduleData;
  }

  const headerRow = values[headerRowIndex];
  console.log('Header row:', headerRow);

  // Find positions of Type and Status headers
  const typePositions: number[] = [];
  const statusPositions: number[] = [];

  headerRow.forEach((cell, index) => {
    if (cell && cell.toLowerCase().includes('type:')) {
      typePositions.push(index);
    } else if (cell && cell.toLowerCase().includes('status:')) {
      statusPositions.push(index);
    }
  });

  console.log('Type positions:', typePositions);
  console.log('Status positions:', statusPositions);

  // Process data rows below headers
  for (let rowIndex = headerRowIndex + 1; rowIndex < values.length; rowIndex++) {
    const dataRow = values[rowIndex];
    
    // Stop processing if we encounter an empty row
    if (!dataRow || dataRow.every(cell => !cell || cell.trim() === '')) {
      console.log('Encountered empty row at index', rowIndex, 'stopping processing');
      break; // Stop processing completely when we hit an empty row
    }

    const rowData: {
      type: string;
      status: string;
      type2?: string;
      status2?: string;
    } = {
      type: '',
      status: ''
    };

    // Get first type and status pair
    if (typePositions.length > 0 && statusPositions.length > 0) {
      rowData.type = dataRow[typePositions[0]] || '';
      rowData.status = dataRow[statusPositions[0]] || '';
    }

    // Get second type and status pair if they exist
    if (typePositions.length > 1 && statusPositions.length > 1) {
      rowData.type2 = dataRow[typePositions[1]] || '';
      rowData.status2 = dataRow[statusPositions[1]] || '';
    }

    // Only add rows that have at least one type value
    if (rowData.type.trim() !== '') {
      scheduleData.push(rowData);
    }
  }

  console.log('Parsed schedule data:', scheduleData);
  return scheduleData;
}
