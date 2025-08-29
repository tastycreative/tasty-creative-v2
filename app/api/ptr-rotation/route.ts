import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { google } from 'googleapis';
import { revalidateTag } from 'next/cache';

const SHEET_ID = process.env.LIBRARY_SHEET_ID || '1rrRsS69FLFSBodvAq1Loaa90euf2A5gidbiSrJUhFyc';

interface PTRItem {
  id: string;
  sheetRowId: string;
  title: string;
  creatorName: string;
  captionText: string;
  gifUrl?: string;
  previewUrl?: string;
  price: number;
  lastUsed: Date | null;
  usageCount: number;
  rotationStatus: 'Active' | 'Resting' | 'Ready';
  daysSinceLastSent: number | null;
  isReadyForRotation: boolean;
  outcome?: string;
  performanceHistory?: Array<{
    sentDate: string;
    result?: 'good' | 'bad' | 'pending';
  }>;
}

interface DailyPTRStatus {
  sentToday: number;
  goal: number;
  morningPTR: { sent: boolean; item?: PTRItem };
  eveningPTR: { sent: boolean; item?: PTRItem };
  readyForRotation: PTRItem[];
}

// POST - Mark PTR as sent
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session?.accessToken) {
      return NextResponse.json({
        error: 'Google authentication required',
        requiresAuth: true,
      }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, sentAt, result = 'pending' } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const credentials: any = {
      access_token: session.accessToken,
    };

    if (session.refreshToken) {
      credentials.refresh_token = session.refreshToken;
    }

    if (session.expiresAt) {
      credentials.expiry_date = session.expiresAt * 1000;
    }

    oauth2Client.setCredentials(credentials);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Get current PTR Tracking data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'PTR Tracking!A:I',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return NextResponse.json({ error: 'No PTR data found' }, { status: 404 });
    }

    // Find the PTR row by matching the itemId in the first column
    let rowIndex = -1;
    let currentRow: string[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === itemId) {
        rowIndex = i + 1; // Sheet rows are 1-indexed
        currentRow = rows[i];
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'PTR item not found' }, { status: 404 });
    }

    // Get current values
    const currentUsageCount = parseInt(currentRow[6]) || 0;
    const currentPerformanceHistory = currentRow[8] || '[]';
    
    // Parse existing performance history
    let performanceHistory: Array<{ sentDate: string; result?: 'good' | 'bad' | 'pending' }> = [];
    try {
      const parsed = JSON.parse(currentPerformanceHistory);
      performanceHistory = parsed.map((entry: any) => ({
        sentDate: entry.sentDate,
        result: ['good', 'bad', 'pending'].includes(entry.result) ? entry.result : 'pending'
      }));
    } catch (e) {
      performanceHistory = [];
    }

    // Add new performance entry
    const validResult: 'good' | 'bad' | 'pending' = ['good', 'bad', 'pending'].includes(result) ? result : 'pending';
    performanceHistory.push({
      sentDate: sentAt || new Date().toISOString(),
      result: validResult,
    });

    // Update columns F, G, H, I (Last Sent Date, Usage Count, Rotation Status, Performance History)
    const newValues = [
      sentAt || new Date().toISOString(), // Column F - Last Sent Date
      currentUsageCount + 1,              // Column G - Usage Count
      'Resting',                          // Column H - Rotation Status
      JSON.stringify(performanceHistory), // Column I - Performance History
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `PTR Tracking!F${rowIndex}:I${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newValues],
      },
    });

    // Invalidate gallery cache to reflect updates
    try {
      revalidateTag('gallery');
      console.log('🔄 Gallery cache invalidated after PTR rotation update');
    } catch (e) {
      console.log('Could not invalidate gallery cache');
    }

    console.log(`✅ PTR marked as sent: ${itemId} (usage count: ${currentUsageCount + 1})`);

    return NextResponse.json({ 
      success: true,
      itemId,
      usageCount: currentUsageCount + 1,
      lastSentDate: sentAt || new Date().toISOString(),
      rotationStatus: 'Resting',
    });

  } catch (error) {
    console.error('PTR rotation error:', error);
    return NextResponse.json(
      { error: 'Failed to update PTR rotation data' },
      { status: 500 }
    );
  }
}

// GET - Get rotation data based on query params
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session?.accessToken) {
      return NextResponse.json({
        error: 'Google authentication required',
        requiresAuth: true,
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint'); // 'ready', 'daily-status', or default

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const credentials: any = {
      access_token: session.accessToken,
    };

    if (session.refreshToken) {
      credentials.refresh_token = session.refreshToken;
    }

    if (session.expiresAt) {
      credentials.expiry_date = session.expiresAt * 1000;
    }

    oauth2Client.setCredentials(credentials);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Get PTR Tracking data
    console.log('🔍 Attempting to read PTR Tracking sheet...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'PTR Tracking!A:I',
    });

    const rows = response.data.values || [];
    console.log('📋 PTR Tracking sheet response:', {
      totalRows: rows.length,
      firstRow: rows[0],
      sheetId: SHEET_ID,
    });

    if (rows.length === 0) {
      console.log('❌ No PTR data found - empty sheet');
      return NextResponse.json({ 
        error: 'No PTR data found - empty sheet'
      }, { status: 404 });
    }

    // Check if the first row looks like headers or data
    // If first column looks like an item ID (starts with library_row_), treat all rows as data
    const firstRow = rows[0];
    const isFirstRowData = firstRow && firstRow[0] && firstRow[0].toString().startsWith('library_row_');
    
    console.log('🔍 Sheet structure analysis:', {
      isFirstRowData,
      firstRowFirstColumn: firstRow[0],
    });

    let dataRows: string[][];
    if (isFirstRowData) {
      // No header row - all rows are data
      dataRows = rows;
      console.log('📊 No header row detected - treating all rows as data:', dataRows.length);
    } else {
      // Has header row - skip first row
      dataRows = rows.slice(1);
      console.log('📊 Header row detected - data rows:', dataRows.length);
    }

    if (dataRows.length === 0) {
      console.log('❌ No PTR data rows found after header detection');
      return NextResponse.json({ 
        error: 'No PTR data found'
      }, { status: 404 });
    }

    // Process PTR items - Updated column mapping based on actual sheet structure
    const ptrItems: PTRItem[] = dataRows.map((row, index) => {
      console.log(`🔧 Processing PTR row ${index}:`, row);
      
      // Updated column mapping based on your sheet:
      // A: Item ID, B: Creator, C: Is PTR, D: ???, E: ???, F: Last Sent, G: Usage Count, H: Rotation Status, I: Performance History
      const lastSentDate = row[5] ? new Date(row[5]) : null; // Column F
      const usageCount = parseInt(row[6]) || 0; // Column G
      const rotationStatus = row[7] || 'Ready'; // Column H
      const performanceHistoryStr = row[8] || '[]'; // Column I
      
      let performanceHistory: Array<{ sentDate: string; result?: 'good' | 'bad' | 'pending' }> = [];
      try {
        const parsed = JSON.parse(performanceHistoryStr);
        performanceHistory = parsed.map((entry: any) => ({
          sentDate: entry.sentDate,
          result: ['good', 'bad', 'pending'].includes(entry.result) ? entry.result : 'pending'
        }));
      } catch (e) {
        performanceHistory = [];
      }

      // Calculate days since last sent
      const daysSinceLastSent = lastSentDate 
        ? Math.floor((Date.now() - lastSentDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Extract the actual row ID from the full item ID
      let sheetRowId = row[0] || '';
      if (sheetRowId.startsWith('library_row_')) {
        const match = sheetRowId.match(/library_(row_\d+)/);
        if (match) {
          sheetRowId = match[1];
        }
      }

      return {
        id: `ptr_${sheetRowId}_${index}`,
        sheetRowId: sheetRowId, // Use extracted row ID for matching
        title: sheetRowId, // Use row ID as title since we don't have title column
        creatorName: row[1] || '', // Column B - Creator
        captionText: '', // No caption in this sheet structure
        gifUrl: '', // No GIF URL in this sheet structure
        previewUrl: '', // No preview URL in this sheet structure
        price: 0, // No price in this sheet structure
        lastUsed: lastSentDate,
        usageCount,
        rotationStatus: rotationStatus as 'Active' | 'Resting' | 'Ready',
        daysSinceLastSent,
        isReadyForRotation: daysSinceLastSent === null || daysSinceLastSent >= 14,
        outcome: 'Good', // Default for PTR items
        performanceHistory,
      };
    });

    console.log('✅ Processed', ptrItems.length, 'PTR items');

    if (endpoint === 'ready') {
      // Return PTRs that are ready for rotation (14+ days or never sent)
      const readyPTRs = ptrItems.filter(item => item.isReadyForRotation);
      
      // Sort by priority: longest since last sent, then by performance
      readyPTRs.sort((a, b) => {
        // Never sent items first
        if (a.daysSinceLastSent === null && b.daysSinceLastSent !== null) return -1;
        if (a.daysSinceLastSent !== null && b.daysSinceLastSent === null) return 1;
        
        // Then by days since last sent (longer = higher priority)
        if (a.daysSinceLastSent !== null && b.daysSinceLastSent !== null) {
          return b.daysSinceLastSent - a.daysSinceLastSent;
        }
        
        // Finally by usage count (less used = higher priority)
        return a.usageCount - b.usageCount;
      });

      return NextResponse.json({
        readyForRotation: readyPTRs,
        count: readyPTRs.length,
      });
    }

    if (endpoint === 'daily-status') {
      // Check today's PTR activity
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split('T')[0];

      let sentToday = 0;
      const todaysPTRs: PTRItem[] = [];

      ptrItems.forEach(item => {
        if (item.performanceHistory) {
          const todaySends = item.performanceHistory.filter(entry => 
            entry.sentDate.startsWith(todayISO)
          );
          if (todaySends.length > 0) {
            sentToday += todaySends.length;
            todaysPTRs.push(item);
          }
        }
      });

      const readyForRotation = ptrItems.filter(item => item.isReadyForRotation);

      const dailyStatus: DailyPTRStatus = {
        sentToday,
        goal: 2,
        morningPTR: {
          sent: todaysPTRs.length > 0,
          item: todaysPTRs[0],
        },
        eveningPTR: {
          sent: todaysPTRs.length > 1,
          item: todaysPTRs[1],
        },
        readyForRotation: readyForRotation.slice(0, 10), // Top 10 ready PTRs
      };

      return NextResponse.json(dailyStatus);
    }

    // Default: return all PTR items with rotation data
    return NextResponse.json({
      ptrItems,
      totalCount: ptrItems.length,
      readyCount: ptrItems.filter(item => item.isReadyForRotation).length,
    });

  } catch (error) {
    console.error('PTR rotation fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch PTR rotation data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}