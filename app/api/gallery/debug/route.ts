import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { google } from 'googleapis';

const SHEET_ID = process.env.LIBRARY_SHEET_ID || '1rrRsS69FLFSBodvAq1Loaa90euf2A5gidbiSrJUhFyc';

export async function GET(request: NextRequest) {
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
    
    try {
      // Get spreadsheet metadata
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID
      });

      const sheetsInfo = spreadsheetInfo.data.sheets?.map(sheet => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId,
        gridProperties: {
          rowCount: sheet.properties?.gridProperties?.rowCount,
          columnCount: sheet.properties?.gridProperties?.columnCount
        }
      })) || [];

      // Try to read from each sheet
      const sheetData = [];
      for (const sheetInfo of sheetsInfo) {
        if (sheetInfo.title) {
          try {
            const range = `'${sheetInfo.title}'!A1:H10`; // First 10 rows, 8 columns
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: SHEET_ID,
              range: range,
            });
            
            sheetData.push({
              title: sheetInfo.title,
              range: range,
              rowCount: response.data.values?.length || 0,
              headers: response.data.values?.[0] || [],
              sampleData: response.data.values?.slice(1, 3) || [] // First 2 data rows
            });
          } catch (error) {
            sheetData.push({
              title: sheetInfo.title,
              error: error.message
            });
          }
        }
      }

      return NextResponse.json({
        spreadsheetId: SHEET_ID,
        spreadsheetTitle: spreadsheetInfo.data.properties?.title,
        sheets: sheetsInfo,
        sheetData: sheetData,
        session: {
          userId: session.user.id,
          userEmail: session.user.email,
          hasAccessToken: !!session.accessToken
        }
      });

    } catch (error) {
      console.error('Debug error:', error);
      return NextResponse.json({
        error: error.message,
        spreadsheetId: SHEET_ID,
        session: {
          userId: session.user.id,
          userEmail: session.user.email,
          hasAccessToken: !!session.accessToken
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}