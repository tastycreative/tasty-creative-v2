import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

function extractSpreadsheetId(url: string): string | null {
  try {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
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

    const { sheetUrl, scheduleValue } = await request.json();

    if (!sheetUrl || !scheduleValue) {
      return NextResponse.json(
        { error: 'Sheet URL and schedule value are required' },
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

    // Format the schedule value
    const formattedScheduleValue = `Schedule #${scheduleValue}`;
    
    // Update the schedule value in cell H6 (column H, row 6)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'H6', // This corresponds to the schedule cell in the first row of our C6:I61 range
      valueInputOption: 'RAW',
      requestBody: {
        values: [[formattedScheduleValue]]
      }
    });

    console.log(`Updated schedule to: ${formattedScheduleValue}`);

    // Now fetch the updated data to return
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'C6:I61',
    });

    const values = response.data.values || [];
    
    // Parse the updated data using the same logic as the main API
    const schedulerData = parseSchedulerData(values);
    
    // Extract updated schedule name
    const scheduleRow = values[0] || [];
    const updatedScheduleName = scheduleRow[5] || formattedScheduleValue; // Column H (index 5)

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      schedulerData: schedulerData.scheduleData,
      scheduleCheckerData: schedulerData.scheduleCheckerData,
      currentSchedule: updatedScheduleName
    });

  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

// Copy the parseSchedulerData function from the main route
function parseSchedulerData(values: string[][]): {
  scheduleData: Array<{ type: string; status: string; }>;
  scheduleCheckerData: {
    massMessages: Array<{ text: string; checker: string; }>;
    wallPosts: Array<{ text: string; checker: string; }>;
  };
} {
  const scheduleData: Array<{ type: string; status: string; }> = [];
  const scheduleCheckerData = {
    massMessages: [] as Array<{ text: string; checker: string; }>,
    wallPosts: [] as Array<{ text: string; checker: string; }>
  };

  if (!values || values.length === 0) {
    return { scheduleData, scheduleCheckerData };
  }

  console.log('Parsing scheduler data from values:', values.length, 'rows');

  // Find "Broad Schedule Overview" section
  let overviewRowIndex = -1;
  for (let i = 0; i < Math.min(values.length, 10); i++) {
    const row = values[i];
    if (row.some(cell => cell && cell.toLowerCase().includes('broad schedule overview'))) {
      overviewRowIndex = i;
      console.log('Found "Broad Schedule Overview" at row index:', i);
      break;
    }
  }

  if (overviewRowIndex === -1) {
    console.log('No "Broad Schedule Overview" found');
    return { scheduleData, scheduleCheckerData };
  }

  // Look for Type:/Status: headers 2 rows after overview (C14:I15 in original sheet)
  const headerRowIndex = overviewRowIndex + 2;
  
  if (headerRowIndex >= values.length) {
    console.log('No header row found');
    return { scheduleData, scheduleCheckerData };
  }

  console.log('Header row at index:', headerRowIndex, 'Content:', values[headerRowIndex]);

  // Parse schedule data starting from the row after headers
  const dataStartIndex = headerRowIndex + 2; // Skip header row and empty row
  
  for (let i = dataStartIndex; i < values.length; i++) {
    const row = values[i];
    
    if (!row || row.length === 0 || row.every(cell => !cell)) {
      continue; // Skip empty rows
    }

    // Stop if we hit "Schedule Checker" section
    if (row.some(cell => cell && cell.toLowerCase().includes('schedule checker'))) {
      console.log('Found "Schedule Checker" at row', i, '- stopping schedule data parsing');
      break;
    }

    // Extract data from columns C, D, E, F (status) and F, G (type, status)
    const typeCol1 = row[0] ? row[0].trim() : ''; // Column C
    const statusCol1 = row[4] ? row[4].trim() : ''; // Column G
    const typeCol2 = row[5] ? row[5].trim() : ''; // Column F  
    const statusCol2 = row[6] ? row[6].trim() : ''; // Column G

    // Add first type/status pair if both exist
    if (typeCol1 && statusCol1) {
      scheduleData.push({
        type: typeCol1.replace(':', ''), // Remove trailing colon
        status: statusCol1
      });
    }

    // Add second type/status pair if both exist
    if (typeCol2 && statusCol2) {
      scheduleData.push({
        type: typeCol2.replace(':', ''), // Remove trailing colon
        status: statusCol2
      });
    }
  }

  // Parse Schedule Checker data
  let checkerRowIndex = -1;
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (row.some(cell => cell && cell.toLowerCase().includes('schedule checker'))) {
      checkerRowIndex = i;
      console.log('Found "Schedule Checker" section at row index:', i);
      break;
    }
  }

  if (checkerRowIndex !== -1) {
    // Look for Mass Messages and Wall Posts headers
    const headersRowIndex = checkerRowIndex + 2; // Usually 2 rows after "Schedule Checker"
    
    if (headersRowIndex < values.length) {
      console.log('Headers row at index:', headersRowIndex, 'Content:', values[headersRowIndex]);
      
      // Parse data starting from row after headers
      const checkerDataStartIndex = headersRowIndex + 3; // Skip headers and empty rows
      
      for (let i = checkerDataStartIndex; i < values.length; i++) {
        const row = values[i];
        
        if (!row || row.length === 0 || row.every(cell => !cell)) {
          continue; // Skip empty rows
        }

        // Extract Mass Messages data (columns C-F with G as checker)
        let massMessageText = '';
        
        // Check columns C, D, E, F for text content (they may have indentation)
        for (let col = 0; col <= 3; col++) {
          if (row[col] && row[col].trim()) {
            massMessageText = row[col].trim();
            break;
          }
        }
        
        const massMessageChecker = row[4] ? row[4].trim() : '';
        
        if (massMessageText && !massMessageText.toLowerCase().includes('total') === false) {
          scheduleCheckerData.massMessages.push({
            text: massMessageText.trim(),
            checker: massMessageChecker
          });
        }

        // Extract Wall Posts data (columns F-H with I as checker)
        const wallPostText = row[5] ? row[5].trim() : '';
        const wallPostChecker = row[6] ? row[6].trim() : '';
        
        if (wallPostText && !wallPostText.toLowerCase().includes('checker')) {
          scheduleCheckerData.wallPosts.push({
            text: wallPostText.trim(),
            checker: wallPostChecker
          });
        }
      }
    }
  }

  console.log('Final parsed data:');
  console.log('Schedule data items:', scheduleData.length);
  console.log('Mass messages:', scheduleCheckerData.massMessages.length);
  console.log('Wall posts:', scheduleCheckerData.wallPosts.length);

  return { scheduleData, scheduleCheckerData };
}
