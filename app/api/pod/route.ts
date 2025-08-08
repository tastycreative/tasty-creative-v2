import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

// Configuration
const DESTINATION_SPREADSHEET_ID = '1whNomJu69mIidOJk-9kExphJSWRG7ncMea75EtDlEJY';
const DESTINATION_GID = '193810044';

// Extract spreadsheet ID from URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Extract GID from URL
function extractGid(url: string): string | null {
  const match = url.match(/gid=([0-9]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    //console.log("Starting POST request...");

    const session = await auth();

    if (!session || !session.user) {
      //console.log("Not authenticated. No session or user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      //console.log("Not authenticated. No access token found in session.");
      return NextResponse.json(
        { error: "Not authenticated. No access token." },
        { status: 401 }
      );
    }
    // It's also good practice to check for refreshToken if your OAuth flow provides it and it's essential for refreshing tokens.
    // Depending on the Google API client library behavior, a missing refresh token might not be an immediate issue
    // if the access token is still valid, but it will prevent refreshing the token later.
    // For now, we'll proceed if accessToken is present, assuming the library handles refresh token absence gracefully if not strictly needed for this call.

    //console.log("Session retrieved:", session);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken, // session.refreshToken should be available if scoped correctly
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined, // Convert seconds to milliseconds
    });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const { sourceUrl } = await request.json();

    if (!sourceUrl) {
      return NextResponse.json(
        { error: 'Source URL is required' },
        { status: 400 }
      );
    }

    // Validate and extract spreadsheet ID and GID from source URL
    const sourceSpreadsheetId = extractSpreadsheetId(sourceUrl);
    const sourceGid = extractGid(sourceUrl);
    
    if (!sourceSpreadsheetId) {
      return NextResponse.json(
        { error: 'Invalid Google Sheets URL' },
        { status: 400 }
      );
    }

    console.log('Processing source spreadsheet:', sourceSpreadsheetId);
    console.log('Source GID:', sourceGid || 'Using default sheet');

    // Step 1: Get sheet information and validate access to source spreadsheet
    let scheduleSheets: Array<{name: string, id: number}> = [];
    let spreadsheetName = '';
    
    try {
      // First, get spreadsheet metadata to find all Schedule #1 sheets
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: sourceSpreadsheetId,
      });
      
      // Get the spreadsheet name
      spreadsheetName = spreadsheetInfo.data.properties?.title || 'Untitled Spreadsheet';
      console.log('Source spreadsheet name:', spreadsheetName);
      
      // Find all sheets that contain "Schedule #1" in their name and are not hidden
      if (spreadsheetInfo.data.sheets) {
        scheduleSheets = spreadsheetInfo.data.sheets
          .filter(sheet => {
            const sheetTitle = sheet.properties?.title || '';
            const isHidden = sheet.properties?.hidden === true;
            return sheetTitle.includes('Schedule #1') && !isHidden;
          })
          .map(sheet => ({
            name: sheet.properties?.title || '',
            id: sheet.properties?.sheetId || 0
          }))
          .sort((a, b) => {
            // Custom sort to ensure proper alphabetical order (1A, 1B, 1C, etc.)
            const aMatch = a.name.match(/Schedule #1([A-Z])/);
            const bMatch = b.name.match(/Schedule #1([A-Z])/);
            
            if (aMatch && bMatch) {
              return aMatch[1].localeCompare(bMatch[1]);
            }
            return a.name.localeCompare(b.name);
          });
        
        console.log(`Found ${scheduleSheets.length} Schedule #1 sheets (in alphabetical order):`, scheduleSheets.map(s => s.name));
      }
      
      if (scheduleSheets.length === 0) {
        return NextResponse.json(
          { error: 'No visible sheets containing "Schedule #1" found in the spreadsheet' },
          { status: 400 }
        );
      }

      // Test access to all schedule sheets to ensure we can read them
      for (const sheet of scheduleSheets) {
        const testRange = `'${sheet.name}'!C12:T12`;
        console.log('Testing access to range:', testRange);
        
        try {
          await sheets.spreadsheets.values.get({
            spreadsheetId: sourceSpreadsheetId,
            range: testRange,
          });
        } catch (rangeError) {
          console.warn(`Could not access range in sheet "${sheet.name}":`, rangeError);
          // Continue with other sheets even if one fails
        }
      }

      console.log('Successfully validated access to source spreadsheet');
    } catch (error: unknown) {
      console.error('Error reading source spreadsheet:', error);
      
      // Check if the error is from Google API and has a 403 status
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 403 && 'errors' in error && Array.isArray(error.errors) && error.errors.length > 0) {
        console.error('Google API Permission Error (403):', error.errors[0].message);
        return NextResponse.json(
          {
            error: 'GooglePermissionDenied',
            message: `Google API Error: ${error.errors[0].message || 'The authenticated Google account does not have permission for the source spreadsheet.'}`,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to read source spreadsheet. Please check if the spreadsheet is accessible with your Google account.' },
        { status: 400 }
      );
    }

    // Step 2: Create a copy of the destination spreadsheet
    let newSpreadsheetId: string;
    try {
      // Create a more descriptive filename using the source spreadsheet name
      const currentDate = new Date();
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const timeStr = currentDate.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }); // HH:MM format
      const newFileName = `${spreadsheetName} - ${dateStr} ${timeStr}`;
      
      const copyResponse = await drive.files.copy({
        fileId: DESTINATION_SPREADSHEET_ID,
        requestBody: {
          name: newFileName,
        },
      });

      newSpreadsheetId = copyResponse.data.id!;
      console.log('Created copy with ID:', newSpreadsheetId);
    } catch (error: unknown) {
      console.error('Error creating copy:', error);
      
      // Check if the error is from Google API and has a 403 status
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 403 && 'errors' in error && Array.isArray(error.errors) && error.errors.length > 0) {
        console.error('Google API Permission Error (403):', error.errors[0].message);
        return NextResponse.json(
          {
            error: 'GooglePermissionDenied',
            message: `Google API Error: ${error.errors[0].message || 'The authenticated Google account does not have permission for the destination spreadsheet.'}`,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create copy of destination spreadsheet' },
        { status: 500 }
      );
    }

    // Step 2.5: Create additional sheets for each Schedule #1 sheet found and set up IMPORTRANGE formulas
    try {
      const sourceSpreadsheetUrl = `https://docs.google.com/spreadsheets/d/${sourceSpreadsheetId}`;

      // Process sheets in reverse order so #1A ends up as the first sheet
      for (let i = scheduleSheets.length - 1; i >= 0; i--) {
        const schedule = scheduleSheets[i];
        let targetSheetId: number;

        // Create duplicate sheets for all schedules (including the first one)
        try {
          // Duplicate the original template sheet for each schedule
          const duplicateSheetResponse = await sheets.spreadsheets.batchUpdate({
            spreadsheetId: newSpreadsheetId,
            requestBody: {
              requests: [
                {
                  duplicateSheet: {
                    sourceSheetId: parseInt(DESTINATION_GID),
                    newSheetName: schedule.name,
                  },
                },
              ],
            },
          });
          
          const newSheet = duplicateSheetResponse.data.replies?.[0]?.duplicateSheet?.properties;
          if (newSheet?.sheetId) {
            targetSheetId = newSheet.sheetId;
            console.log(`Duplicated template sheet for "${schedule.name}" with ID: ${targetSheetId}`);
          } else {
            console.error(`Failed to get sheet ID for ${schedule.name}`);
            continue; // Skip this schedule if sheet creation fails
          }
        } catch (error) {
          console.error(`Failed to duplicate template sheet for ${schedule.name}:`, error);
          continue; // Skip this schedule if sheet creation fails
        }

        // Create IMPORTRANGE formulas for this specific schedule sheet
        const importFormulas = [
          // B2: =IMPORTRANGE("url", "Sheet!E12:E") - Source column E
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!E12:E")`],
          // C2: =IMPORTRANGE("url", "Sheet!D12:D") - Source column D  
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!D12:D")`],
          // D2: =IMPORTRANGE("url", "Sheet!F12:F") - Source column F
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!F12:F")`],
          // E2: =IMPORTRANGE("url", "Sheet!G12:G") - Source column G
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!G12:G")`],
          // F2: Skip - leave as template (index 4 skipped)
          null,
          // G2: =IMPORTRANGE("url", "Sheet!I12:I") - Source column I
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!I12:I")`],
          // H2: Skip - leave as template (index 6 skipped)
          null,
          // I2: =IMPORTRANGE("url", "Sheet!K12:K") - Source column K
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!K12:K")`],
          // J2: Skip - leave as template (index 8 skipped)
          null,
          // K2: =IMPORTRANGE("url", "Sheet!N12:N") - Source column N
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!N12:N")`],
          // L2: =IMPORTRANGE("url", "Sheet!M12:M") - Source column M
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!M12:M")`],
          // M2: =IMPORTRANGE("url", "Sheet!O12:O") - Source column O
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!O12:O")`],
          // N2: =IMPORTRANGE("url", "Sheet!P12:P") - Source column P
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!P12:P")`],
          // O2: =IMPORTRANGE("url", "Sheet!R12:R") - Source column R
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!R12:R")`],
          // P2: =IMPORTRANGE("url", "Sheet!T12:T") - Source column T
          [`=IMPORTRANGE("${sourceSpreadsheetUrl}", "'${schedule.name}'!T12:T")`],
        ];

        // Create update requests for this sheet's IMPORTRANGE formulas
        const formulaRequests = importFormulas
          .map((formula, index) => {
            if (formula === null) return null; // Skip columns F, H, J
            
            const targetColumn = index + 1; // B=1, C=2, etc. (0-indexed offset + 1)
            return {
              updateCells: {
                range: {
                  sheetId: targetSheetId,
                  startRowIndex: 1, // Row 2 (0-indexed)
                  endRowIndex: 2,   // Row 2 (exclusive end)
                  startColumnIndex: targetColumn,
                  endColumnIndex: targetColumn + 1,
                },
                rows: [
                  {
                    values: [
                      {
                        userEnteredValue: {
                          formulaValue: formula[0],
                        },
                      },
                    ],
                  },
                ],
                fields: 'userEnteredValue',
              },
            };
          })
          .filter(request => request !== null); // Remove null entries

        // Execute the batch update for formulas
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: newSpreadsheetId,
          requestBody: {
            requests: formulaRequests,
          },
        });

        // Auto-resize columns for this sheet in a separate request
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: newSpreadsheetId,
            requestBody: {
              requests: [
                {
                  autoResizeDimensions: {
                    dimensions: {
                      sheetId: targetSheetId,
                      dimension: 'COLUMNS',
                      startIndex: 1, // Column B (0-indexed, so B=1)
                      endIndex: 16,  // Column P (0-indexed, so P=15, but endIndex is exclusive so 16)
                    },
                  },
                },
              ],
            },
          });
        } catch (resizeError) {
          console.warn(`Failed to auto-resize columns for sheet ${schedule.name}:`, resizeError);
        }

        console.log(`Successfully set up IMPORTRANGE formulas for sheet: ${schedule.name}`);
      }

      console.log(`Successfully set up IMPORTRANGE formulas for ${scheduleSheets.length} Schedule #1 sheets`);

    } catch (error) {
      console.error('Error setting up IMPORTRANGE formulas:', error);
      
      // Clean up the created file if formula setup failed
      try {
        await drive.files.delete({
          fileId: newSpreadsheetId,
        });
      } catch (deleteError) {
        console.error('Error deleting file after failed formula setup:', deleteError);
      }
      
      return NextResponse.json({ 
        error: 'Failed to set up IMPORTRANGE formulas',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 4: Create shareable link and return success
    try {
      await drive.permissions.create({
        fileId: newSpreadsheetId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      const file = await drive.files.get({
        fileId: newSpreadsheetId,
        fields: 'webViewLink,name',
      });

      return NextResponse.json({
        success: true,
        message: `IMPORTRANGE formulas set up successfully for ${scheduleSheets.length} Schedule #1 sheets`,
        spreadsheetUrl: file.data.webViewLink,
        spreadsheetId: newSpreadsheetId,
        fileName: file.data.name,
        syncType: 'IMPORTRANGE',
        sourceSpreadsheetName: spreadsheetName,
        scheduleSheets: scheduleSheets.map(s => s.name),
        sheetsCount: scheduleSheets.length,
        realTimeSync: true,
        columnMapping: 'E→B, D→C, F→D, G→E, I→G, K→I, N→K, M→L, O→M, P→N, R→O, T→P',
      });
    } catch (error) {
      console.error('Error creating permissions or getting file info:', error);
      return NextResponse.json({ 
        error: 'Failed to finalize spreadsheet setup',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POD API - Use POST method to copy spreadsheet data',
    endpoints: {
      POST: '/api/pod - Copy data from source spreadsheet to destination template'
    },
    required_env_vars: [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET', 
      'GOOGLE_REDIRECT_URI'
    ],
    authentication: 'Requires Google OAuth authentication via session'
  });
}
