import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';
import { revalidateTag } from 'next/cache';

// Add caching for favorites API too
export const revalidate = 300; // Cache for 5 minutes
export const dynamic = 'force-dynamic'; // Always run on server (needed for auth)

const SHEET_ID = process.env.LIBRARY_SHEET_ID || '1rrRsS69FLFSBodvAq1Loaa90euf2A5gidbiSrJUhFyc';

export async function POST(request: NextRequest) {
  try {
    console.log('=== FAVORITES API POST START ===');
    console.log('SHEET_ID:', SHEET_ID);
    const session = await auth();
    console.log('Session:', !!session, session?.user?.email);
    
    if (!session) {
      console.log('No session found - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { itemId, title, creator, sheetReference, addedAt } = body;

    if (!itemId || !title) {
      console.log('Missing required fields - itemId:', itemId, 'title:', title);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Setting up Google Sheets API...');
    // Initialize Google Sheets API with OAuth2
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials from session
    const credentials: any = {
      access_token: (session as any).accessToken
    };
    
    if ((session as any).refreshToken) {
      credentials.refresh_token = (session as any).refreshToken;
    }
    
    console.log('OAuth2 credentials set - has access_token:', !!credentials.access_token, 'has refresh_token:', !!credentials.refresh_token);
    oauth2Client.setCredentials(credentials);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Try to find or create a "Favorites" sheet
    let favoritesSheetName = 'Favorites';
    console.log('Checking if Favorites sheet exists...');
    
    try {
      // Check if Favorites sheet exists
      await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${favoritesSheetName}!A1:A1`,
      });
      console.log('Favorites sheet exists');
    } catch (error) {
      console.log('Favorites sheet does not exist, creating...', error.message);
      // Create Favorites sheet if it doesn't exist
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: favoritesSheetName,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 10
                  }
                }
              }
            }]
          }
        });

        // Add headers to the new sheet
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${favoritesSheetName}!A1:F1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Item ID', 'Title', 'Creator', 'Sheet Reference', 'Added At', 'Added By']]
          }
        });
      } catch (createError) {
        console.error('Error creating Favorites sheet:', createError);
        return NextResponse.json({ error: 'Failed to create favorites sheet' }, { status: 500 });
      }
    }

    console.log('Checking if item already exists in favorites...');
    // Check if item is already in favorites
    const existingFavorites = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${favoritesSheetName}!A:A`,
    });

    const existingIds = existingFavorites.data.values?.map(row => row[0]) || [];
    console.log('Existing favorite IDs:', existingIds);
    
    if (existingIds.includes(itemId)) {
      console.log('Item already in favorites - returning 409');
      return NextResponse.json({ error: 'Item already in favorites' }, { status: 409 });
    }

    console.log('Adding item to favorites sheet...');
    // Add the favorite to the sheet
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${favoritesSheetName}!A:F`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          itemId,
          title,
          creator,
          sheetReference,
          addedAt,
          session.user?.email || session.user?.name || 'Unknown'
        ]]
      }
    });

    console.log('Successfully added to favorites!', appendResponse.data.updates?.updatedRange);
    
    // Invalidate gallery cache when favorites change
    try {
      revalidateTag('gallery');
      console.log('🔄 Gallery cache invalidated');
    } catch (e) {
      console.log('Could not invalidate gallery cache');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Added to favorites successfully',
      updatedRange: appendResponse.data.updates?.updatedRange
    });

  } catch (error) {
    console.error('=== FAVORITES API ERROR ===', error);
    console.error('Error details:', error.message);
    return NextResponse.json({ error: 'Failed to add to favorites' }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('=== FAVORITES API GET START ===');
    const session = await auth();
    
    if (!session) {
      console.log('No session - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Setting up Google Sheets API...');
    // Initialize Google Sheets API with OAuth2
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials from session
    const credentials: any = {
      access_token: (session as any).accessToken
    };
    
    if ((session as any).refreshToken) {
      credentials.refresh_token = (session as any).refreshToken;
    }
    
    oauth2Client.setCredentials(credentials);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Get favorites data
    console.log('Fetching favorites data...');
    const favoritesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Favorites!A:F',
    });

    const favoritesRows = favoritesResponse.data.values || [];
    console.log('Favorites rows:', favoritesRows.length);
    
    if (favoritesRows.length <= 1) {
      return NextResponse.json({ 
        favorites: [],
        fullItems: [] 
      });
    }

    const favoritesHeaders = favoritesRows[0];
    const favorites = favoritesRows.slice(1).map(row => {
      const favorite: any = {};
      favoritesHeaders.forEach((header, index) => {
        favorite[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || '';
      });
      return favorite;
    });

    console.log('Parsed favorites:', favorites.length);

    // Now get the full library data to look up the complete item details
    console.log('Fetching main library data for reference lookup...');
    const mainResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'MasterSheet DB (combined)'!A:Z`,
    });

    const mainRows = mainResponse.data.values || [];
    const mainHeaders = mainRows[0] || [];
    const mainDataRows = mainRows.slice(1);

    console.log('Main library rows:', mainDataRows.length);

    // Helper function to get column value by name
    const getMainColumnValue = (row: string[], columnName: string) => {
      const index = mainHeaders.findIndex(h => h?.toLowerCase().includes(columnName.toLowerCase()));
      return index >= 0 ? (row[index] || '') : '';
    };

    // Helper function to parse performance metrics
    const parsePerformanceMetrics = (performanceStr: string): { totalBuys: number; totalRevenue: number } => {
      const buysMatch = performanceStr.match(/(\d+)\s*buys?/i);
      const revenueMatch = performanceStr.match(/\$([0-9,]+)/);
      
      const totalBuys = buysMatch ? parseInt(buysMatch[1]) : 0;
      const totalRevenue = revenueMatch ? parseFloat(revenueMatch[1].replace(/,/g, '')) : 0;
      
      return { totalBuys, totalRevenue };
    };

    // Helper function to determine category
    const determineCategoryFromStyle = (contentStyle: string): string => {
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
    };

    // Map favorites to full item details by looking up in main library
    const fullItems = favorites.map((favorite, favIndex) => {
      // Try to find the original item using the sheet reference
      const itemId = favorite.item_id || `library_row_${favIndex + 2}_${favIndex}`;
      
      // Look for the corresponding row in main data
      // The itemId format is typically: library_row_X_Y where X is the row number
      const rowMatch = itemId.match(/row_(\d+)/);
      let mainRowIndex = -1;
      
      if (rowMatch) {
        // Convert to 0-based index (subtract 2 because row 1 is headers, and we want 0-based)
        mainRowIndex = parseInt(rowMatch[1]) - 2;
      }

      let mainRow: string[] = [];
      if (mainRowIndex >= 0 && mainRowIndex < mainDataRows.length) {
        mainRow = mainDataRows[mainRowIndex];
      } else {
        // Fallback: try to find by title or creator
        const matchIndex = mainDataRows.findIndex(row => {
          const rowTitle = getMainColumnValue(row, 'title') || getMainColumnValue(row, 'content style');
          const rowCreator = getMainColumnValue(row, 'creator') || getMainColumnValue(row, 'model');
          return (rowTitle && favorite.title?.includes(rowTitle)) || 
                 (rowCreator && favorite.creator?.includes(rowCreator));
        });
        if (matchIndex >= 0) {
          mainRow = mainDataRows[matchIndex];
        }
      }

      if (mainRow.length > 0) {
        // We found the original data, build full item
        const contentStyle = getMainColumnValue(mainRow, 'content style') || getMainColumnValue(mainRow, 'style');
        const creatorName = getMainColumnValue(mainRow, 'creator') || getMainColumnValue(mainRow, 'model');
        const captionText = getMainColumnValue(mainRow, 'caption') || '';
        const priceStr = getMainColumnValue(mainRow, 'price') || '0';
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
        
        const performanceStr = getMainColumnValue(mainRow, 'performance') || getMainColumnValue(mainRow, 'buys') || '';
        const { totalBuys, totalRevenue } = parsePerformanceMetrics(performanceStr);

        return {
          id: itemId,
          sheetRowId: `row_${mainRowIndex + 2}`,
          title: favorite.title || `${creatorName} - ${contentStyle}` || `Content ${favIndex + 1}`,
          captionText,
          price,
          totalBuys,
          totalRevenue,
          category: determineCategoryFromStyle(contentStyle),
          dateAdded: favorite.added_at || new Date().toISOString(),
          contentType: 'FAVORITE' as const,
          contentStyle,
          messageType: getMainColumnValue(mainRow, 'message type') || getMainColumnValue(mainRow, 'type'),
          gifUrl: getMainColumnValue(mainRow, 'content') || getMainColumnValue(mainRow, 'preview'),
          previewUrl: getMainColumnValue(mainRow, 'content') || getMainColumnValue(mainRow, 'preview'),
          usageCount: 0,
          lastUsed: null,
          notes: '',
          isFavorite: true, // Always true since this is from favorites
          isRelease: false,
          creatorName
        };
      } else {
        // Fallback if we can't find the original data
        return {
          id: itemId,
          sheetRowId: favorite.sheet_reference || '',
          title: favorite.title || 'Unknown Item',
          captionText: '',
          price: 0,
          totalBuys: 0,
          totalRevenue: 0,
          category: 'Other',
          dateAdded: favorite.added_at || new Date().toISOString(),
          contentType: 'FAVORITE' as const,
          contentStyle: '',
          messageType: '',
          gifUrl: '',
          previewUrl: '',
          usageCount: 0,
          lastUsed: null,
          notes: '',
          isFavorite: true,
          isRelease: false,
          creatorName: favorite.creator || 'Unknown'
        };
      }
    });

    console.log('Mapped full items:', fullItems.length);

    return NextResponse.json({ 
      favorites,
      fullItems,
      count: fullItems.length
    });

  } catch (error) {
    console.error('=== FAVORITES GET ERROR ===', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}