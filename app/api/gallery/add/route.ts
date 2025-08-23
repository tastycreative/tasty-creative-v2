import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { google } from 'googleapis';

const SHEET_ID = process.env.LIBRARY_SHEET_ID || '1rrRsS69FLFSBodvAq1Loaa90euf2A5gidbiSrJUhFyc';
const GALLERY_RANGE = 'A:F';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session?.accessToken) {
      return NextResponse.json({ 
        error: 'Google authentication required' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { sheetRowIds, contentType } = body;

    if (!sheetRowIds || !Array.isArray(sheetRowIds) || sheetRowIds.length === 0) {
      return NextResponse.json({ error: 'Sheet row IDs required' }, { status: 400 });
    }

    if (!contentType || !['FAVORITE', 'RELEASE'].includes(contentType)) {
      return NextResponse.json({ error: 'Valid content type required' }, { status: 400 });
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
    const galleryWorksheetName = `${contentType.toLowerCase()}_${session.user.email?.split('@')[0] || session.user.id}`;

    try {
      // Try to get existing worksheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${galleryWorksheetName}!${GALLERY_RANGE}`,
      });

      const existingRows = response.data.values || [];
      const existingRowIds = existingRows.slice(1).map(row => row[0]).filter(Boolean);
      
      // Filter out duplicates
      const newRowIds = sheetRowIds.filter(id => !existingRowIds.includes(id));

      if (newRowIds.length === 0) {
        return NextResponse.json({ 
          error: 'All selected items are already in your gallery',
          duplicateCount: existingRowIds.length 
        }, { status: 400 });
      }

      // Create new rows for the worksheet
      const newRows = newRowIds.map(rowId => [
        rowId,                    // Row_ID
        new Date().toISOString(), // Date_Added
        '',                       // Notes
        '0',                      // Usage_Count
        ''                        // Last_Used
      ]);

      // Append to existing worksheet
      const allRows = existingRows.length > 0 ? [...existingRows, ...newRows] : [
        ['Row_ID', 'Date_Added', 'Notes', 'Usage_Count', 'Last_Used'], // Headers
        ...newRows
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${galleryWorksheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: allRows,
        },
      });

      return NextResponse.json({
        success: true,
        addedCount: newRowIds.length,
        skippedCount: sheetRowIds.length - newRowIds.length
      });

    } catch (worksheetError) {
      // Worksheet doesn't exist, create it
      try {
        // First, try to create the worksheet
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: galleryWorksheetName
                }
              }
            }]
          }
        });

        // Add headers and data
        const newRows = [
          ['Row_ID', 'Date_Added', 'Notes', 'Usage_Count', 'Last_Used'], // Headers
          ...sheetRowIds.map(rowId => [
            rowId,
            new Date().toISOString(),
            '',
            '0',
            ''
          ])
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${galleryWorksheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: newRows,
          },
        });

        return NextResponse.json({
          success: true,
          addedCount: sheetRowIds.length,
          skippedCount: 0,
          worksheetCreated: true
        });

      } catch (createError) {
        console.error('Failed to create worksheet:', createError);
        return NextResponse.json(
          { error: 'Failed to create gallery worksheet' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Gallery add error:', error);
    return NextResponse.json(
      { error: 'Failed to add content to gallery' },
      { status: 500 }
    );
  }
}