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

    // Step 1: Get sheet information and read data from source spreadsheet (C11:K)
    let sourceData: string[][] = [];
    let sheetName = '';
    
    try {
      // First, get spreadsheet metadata to find the correct sheet
      if (sourceGid) {
        const spreadsheetInfo = await sheets.spreadsheets.get({
          spreadsheetId: sourceSpreadsheetId,
        });
        
        const targetSheet = spreadsheetInfo.data.sheets?.find(
          sheet => sheet.properties?.sheetId?.toString() === sourceGid
        );
        
        if (targetSheet?.properties?.title) {
          sheetName = targetSheet.properties.title;
          console.log('Found sheet name:', sheetName);
        } else {
          return NextResponse.json(
            { error: `Sheet with GID ${sourceGid} not found in the spreadsheet` },
            { status: 400 }
          );
        }
      }

      // Construct the range with sheet name if we have one - Skip the header row by starting from C12
      const range = sheetName ? `'${sheetName}'!C12:T` : 'C12:T';
      console.log('Reading from range:', range);

      const sourceResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: sourceSpreadsheetId,
        range: range,
      });

      sourceData = sourceResponse.data.values || [];
      console.log(`Read ${sourceData.length} rows from source spreadsheet`);

      if (sourceData.length === 0) {
        return NextResponse.json(
          { error: `No data found in range ${range} of source spreadsheet` },
          { status: 400 }
        );
      }
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
      const copyResponse = await drive.files.copy({
        fileId: DESTINATION_SPREADSHEET_ID,
        requestBody: {
          name: `POD Data Copy - ${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString()}`,
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

    // Step 3: Write data to the new copy (B2:P) with column remapping
    try {
      // Column mapping: 
      // Original: E->B, D->C, F->D, G->E, I->G, K->I
      // Additional: N->K, M->L, O->M, P->N, R->O, T->P
      // Source columns C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T = indices 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17
      // Target columns B,C,D,E,F,G,H,I,J,K,L,M,N,O,P = indices 0-14
      const remappedData = sourceData.map(row => {
        const newRow = new Array(15).fill(''); // Initialize with 15 empty columns (B to P)
        
        // Original mappings
        // E (index 2) -> B (index 0)
        if (row[2] !== undefined) newRow[0] = row[2];
        // D (index 1) -> C (index 1) 
        if (row[1] !== undefined) newRow[1] = row[1];
        // F (index 3) -> D (index 2)
        if (row[3] !== undefined) newRow[2] = row[3];
        // G (index 4) -> E (index 3)
        if (row[4] !== undefined) newRow[3] = row[4];
        // I (index 6) -> G (index 5)
        if (row[6] !== undefined) newRow[5] = row[6];
        // K (index 8) -> I (index 7)
        if (row[8] !== undefined) newRow[7] = row[8];
        
        // Additional mappings
        // N (index 11) -> K (index 9)
        if (row[11] !== undefined) newRow[9] = row[11];
        // M (index 10) -> L (index 10)
        if (row[10] !== undefined) newRow[10] = row[10];
        // O (index 12) -> M (index 11)
        if (row[12] !== undefined) newRow[11] = row[12];
        // P (index 13) -> N (index 12)
        if (row[13] !== undefined) newRow[12] = row[13];
        // R (index 15) -> O (index 13)
        if (row[15] !== undefined) newRow[13] = row[15];
        // T (index 17) -> P (index 14)
        if (row[17] !== undefined) newRow[14] = row[17];
        
        // Columns F, H, J remain empty as per requirements
        
        return newRow;
      });

      const numRows = remappedData.length;
      const endRow = 1 + numRows; // B2 starts at row 2, so end is 1 + numRows
      const range = `B2:P${endRow}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: newSpreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        requestBody: {
          values: remappedData,
        },
      });

      console.log(`Successfully wrote ${remappedData.length} rows to ${range} with column remapping`);

      // Step 4: Auto-resize columns to fit content
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: newSpreadsheetId,
          requestBody: {
            requests: [
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId: parseInt(DESTINATION_GID),
                    dimension: 'COLUMNS',
                    startIndex: 1, // Column B (0-indexed, so B=1)
                    endIndex: 16,  // Column P (0-indexed, so P=15, but endIndex is exclusive so 16)
                  },
                },
              },
            ],
          },
        });
        console.log('Successfully auto-resized columns B to P');
      } catch (resizeError) {
        console.warn('Failed to auto-resize columns, but data was written successfully:', resizeError);
        // Don't fail the entire operation if auto-resize fails
      }

      console.log(`Successfully wrote ${remappedData.length} rows to ${range}`);
    } catch (error: unknown) {
      console.error('Error writing to destination:', error);
      
      // Check if the error is from Google API and has a 403 status
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 403 && 'errors' in error && Array.isArray(error.errors) && error.errors.length > 0) {
        console.error('Google API Permission Error (403):', error.errors[0].message);
        return NextResponse.json(
          {
            error: 'GooglePermissionDenied',
            message: `Google API Error: ${error.errors[0].message || 'The authenticated Google account does not have permission to write to the new spreadsheet.'}`,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to write data to destination spreadsheet' },
        { status: 500 }
      );
    }

    // Step 5: Generate the URL for the new spreadsheet
    const newSpreadsheetUrl = `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit#gid=${DESTINATION_GID}`;

    return NextResponse.json({
      success: true,
      message: 'Data successfully copied with extended column remapping',
      sourceSpreadsheetId,
      sourceGid: sourceGid || null,
      sourceSheetName: sheetName || 'Default sheet',
      newSpreadsheetId,
      newSpreadsheetUrl,
      rowsCopied: sourceData.length,
      columnMapping: 'E→B, D→C, F→D, G→E, I→G, K→I, N→K, M→L, O→M, P→N, R→O, T→P',
    });

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
