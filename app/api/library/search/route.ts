import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { google } from 'googleapis';

const SHEET_ID = process.env.LIBRARY_SHEET_ID || '1rrRsS69FLFSBodvAq1Loaa90euf2A5gidbiSrJUhFyc';
const RANGE = 'A:H';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!session?.accessToken) {
      return NextResponse.json({ 
        error: 'Google authentication required',
        requiresAuth: true,
        message: 'Please sign in with Google to access spreadsheet data'
      }, { status: 401 });
    }

    // Check if we have a refresh token - but allow continuation with warning
    if (!session?.refreshToken) {
      console.warn('No refresh token available - API calls may fail when access token expires');
      // Don't block - let's see what happens
    }

    // Fetch data directly from Google Sheets
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    // First, get information about the spreadsheet to find the correct sheet
    let response;
    try {
      // Try different possible sheet names/ranges
      const possibleRanges = [
        RANGE, // Default range (first sheet)
        `Sheet1!${RANGE}`, // Explicitly Sheet1
        `'The Schedule Library'!${RANGE}`, // If the sheet has this name
        `'Library'!${RANGE}`, // Common name
        `'Data'!${RANGE}` // Another common name
      ];

      let spreadsheetInfo;
      try {
        spreadsheetInfo = await sheets.spreadsheets.get({
          spreadsheetId: SHEET_ID
        });
      } catch (infoError) {
        console.log('Could not get spreadsheet info:', infoError.message);
      }

      if (spreadsheetInfo && spreadsheetInfo.data.sheets) {
        console.log('Available sheets:', spreadsheetInfo.data.sheets.map(sheet => sheet.properties?.title));
        // Try the first sheet with data
        const firstSheet = spreadsheetInfo.data.sheets[0];
        if (firstSheet && firstSheet.properties?.title) {
          possibleRanges.unshift(`'${firstSheet.properties.title}'!${RANGE}`);
        }
      }

      let lastError;
      for (const range of possibleRanges) {
        try {
          console.log(`Trying range: ${range}`);
          response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: range,
          });
          console.log(`Success with range: ${range}, rows: ${response.data.values?.length || 0}`);
          break;
        } catch (error) {
          console.log(`Failed with range ${range}:`, error.message);
          lastError = error;
          continue;
        }
      }

      if (!response) {
        throw lastError || new Error('Could not read from any sheet range');
      }
    } catch (error) {
      console.error('Sheets API error:', error);
      return NextResponse.json({
        error: `Failed to access spreadsheet: ${error.message}`,
        details: 'Check if the sheet exists and you have permission to access it'
      }, { status: 500 });
    }

    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const dataRows = rows.slice(1);

    // Map headers for easier access
    const getColumnValue = (row: string[], columnName: string) => {
      const index = headers.findIndex(h => h?.toLowerCase().includes(columnName.toLowerCase()));
      return index >= 0 ? (row[index] || '') : '';
    };

    // Convert sheet rows to library items
    let items = dataRows.map((row, index) => {
      const contentStyle = getColumnValue(row, 'content style') || getColumnValue(row, 'style');
      const creatorName = getColumnValue(row, 'creator') || getColumnValue(row, 'model');
      const captionText = getColumnValue(row, 'caption') || '';
      const priceStr = getColumnValue(row, 'price') || '0';
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      
      const performanceStr = getColumnValue(row, 'performance') || getColumnValue(row, 'buys') || '';
      const { totalBuys, totalRevenue } = parsePerformanceMetrics(performanceStr);

      return {
        id: `row_${index + 2}`, // Sheet row ID
        title: `${creatorName} - ${contentStyle}` || `Content ${index + 2}`,
        captionText,
        price,
        totalBuys,
        totalRevenue,
        category: determineCategoryFromStyle(contentStyle),
        contentStyle,
        messageType: getColumnValue(row, 'message type') || getColumnValue(row, 'type'),
        gifUrl: getColumnValue(row, 'content') || getColumnValue(row, 'preview'),
        previewUrl: getColumnValue(row, 'content') || getColumnValue(row, 'preview'),
        creatorName
      };
    });

    // Apply search filter
    if (query) {
      items = items.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.captionText.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.contentStyle.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort by performance (revenue)
    items.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Apply limit
    const limitedItems = items.slice(0, limit);

    // Get unique categories
    const categories = [...new Set(items.map(item => item.category))]
      .filter(Boolean)
      .map(cat => ({
        name: cat,
        count: items.filter(item => item.category === cat).length
      }));

    return NextResponse.json({
      items: limitedItems,
      total: items.length,
      categories
    });
  } catch (error) {
    console.error('Library search error:', error);
    return NextResponse.json(
      { error: 'Failed to search library content' },
      { status: 500 }
    );
  }
}

function parsePerformanceMetrics(performanceStr: string): { totalBuys: number; totalRevenue: number } {
  const buysMatch = performanceStr.match(/(\d+)\s*buys?/i);
  const revenueMatch = performanceStr.match(/\$([0-9,]+)/);
  
  const totalBuys = buysMatch ? parseInt(buysMatch[1]) : 0;
  const totalRevenue = revenueMatch ? parseFloat(revenueMatch[1].replace(/,/g, '')) : 0;
  
  return { totalBuys, totalRevenue };
}

function determineCategoryFromStyle(contentStyle: string): string {
  if (!contentStyle) return 'Other';
  
  const style = contentStyle.toLowerCase();
  
  if (style.includes('sextape') || style.includes('sex tape')) return 'PTR';
  if (style.includes('threesome') || style.includes('group')) return 'Group';
  if (style.includes('masturbation') || style.includes('solo') || style.includes('pussy play')) return 'Solo';
  if (style.includes('blowjob') || style.includes('bj') || style.includes('oral')) return 'BJ';
  if (style.includes('roleplay') || style.includes('role play')) return 'PTR';
  if (style.includes('shower') || style.includes('bath')) return 'Solo';
  if (style.includes('lingerie') || style.includes('tease')) return 'Tease';
  
  return 'Other';
}

// POST endpoint to manually add content to library (for testing/seeding)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin rights for adding to library
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'SWD'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      captionText,
      price,
      category,
      contentStyle,
      messageType,
      gifUrl,
      previewUrl,
      creatorName
    } = body;

    if (!title || !captionText) {
      return NextResponse.json({ 
        error: 'Title and caption are required' 
      }, { status: 400 });
    }

    const libraryItem = await prisma.libraryContent.create({
      data: {
        title,
        captionText,
        price: price || 0,
        category,
        contentStyle,
        messageType,
        gifUrl,
        previewUrl,
        creatorName,
        totalBuys: 0,
        totalRevenue: 0
      }
    });

    return NextResponse.json({ 
      success: true, 
      item: libraryItem 
    });
  } catch (error) {
    console.error('Library creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create library content' },
      { status: 500 }
    );
  }
}