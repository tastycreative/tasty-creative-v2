import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { google } from 'googleapis';
import { unstable_cache } from 'next/cache';

// Next.js Route Segment Config for caching
export const revalidate = 300; // Cache for 5 minutes
export const dynamic = 'force-dynamic'; // Always run on server (needed for auth)
export const fetchCache = 'default-cache'; // Enable fetch caching

const SHEET_ID = process.env.LIBRARY_SHEET_ID || '1rrRsS69FLFSBodvAq1Loaa90euf2A5gidbiSrJUhFyc';
const MAIN_SHEET_RANGE = 'A:Z'; // Main library data - expanded range
const GALLERY_RANGE = 'A:F'; // Gallery worksheet data

// In-memory cache for expensive operations
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  invalidate(keyPattern?: string): void {
    if (keyPattern) {
      // Delete keys matching pattern
      for (const [key] of this.cache) {
        if (key.includes(keyPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all
      this.cache.clear();
    }
  }
}

const memoryCache = new MemoryCache();

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
        message: 'Please sign in with Google to access gallery'
      }, { status: 401 });
    }

    // Warning about missing refresh token but continue
    if (!session?.refreshToken) {
      console.warn('No refresh token available - continuing anyway');
    }

    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('type'); // 'favorites', 'releases', or 'all'
    const category = searchParams.get('category'); // Category filter
    const creator = searchParams.get('creator'); // Creator filter
    const minPrice = searchParams.get('minPrice'); // Price range filter
    const maxPrice = searchParams.get('maxPrice'); // Price range filter
    const minRevenue = searchParams.get('minRevenue'); // Revenue filter
    const query = searchParams.get('q'); // Search query
    const page = parseInt(searchParams.get('page') || '1'); // Page number (1-based)
    const limit = parseInt(searchParams.get('limit') || '20'); // Items per page

    // Generate cache key based on parameters
    const cacheKey = `gallery-${filterType || 'all'}-${category || ''}-${creator || ''}-${minPrice || ''}-${maxPrice || ''}-${minRevenue || ''}-${query || ''}-${page}-${limit}`;
    
    // Try to get from memory cache first
    const cachedResult = memoryCache.get(cacheKey);
    if (cachedResult) {
      console.log('📋 Cache HIT for', cacheKey);
      const response = NextResponse.json(cachedResult);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
      return response;
    }

    console.log('🔄 Cache MISS for', cacheKey, '- fetching fresh data');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials - refresh_token might be undefined
    const credentials: any = {
      access_token: session.accessToken
    };
    
    if (session.refreshToken) {
      credentials.refresh_token = session.refreshToken;
    }
    
    if (session.expiresAt) {
      credentials.expiry_date = session.expiresAt * 1000;
    }
    
    oauth2Client.setCredentials(credentials);

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Get main library data first (this contains all content)
    let mainResponse;
    try {
      // Get spreadsheet info to find the correct sheet
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID
      });

      const availableSheets = spreadsheetInfo.data.sheets?.map(sheet => sheet.properties?.title) || [];
      console.log('Available sheets:', availableSheets);

      // Try different possible sheet names/ranges in order of priority
      const possibleRanges = [
        `'MasterSheet DB (combined)'!A:Z`, // This is likely the main data sheet
        `'Summary View'!A:Z`, // Alternative main sheet
        `'MasterSheet DB (MM)'!A:Z`, // Another data sheet
        `'MasterSheet DB (POST)'!A:Z`, // Another data sheet
        `'The Schedule Library'!A:Z`, // If the sheet has this name
        `'Library'!A:Z`, // Common name
        `'Data'!A:Z`, // Another common name
        `Sheet1!A:Z`, // Default first sheet
        `A:Z` // Fallback to first sheet
      ];

      let lastError;
      let bestRange = '';
      let maxRows = 0;

      // Try each range and pick the one with most data
      for (const range of possibleRanges) {
        try {
          console.log(`Trying range: ${range}`);
          const testResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: range,
          });
          
          const rowCount = testResponse.data.values?.length || 0;
          console.log(`Range ${range}: ${rowCount} rows`);
          
          // Use this range if it has more rows than previous ones
          if (rowCount > maxRows) {
            maxRows = rowCount;
            bestRange = range;
            mainResponse = testResponse;
          }
        } catch (error) {
          console.log(`Failed with range ${range}:`, error.message);
          lastError = error;
          continue;
        }
      }

      if (!mainResponse || maxRows <= 1) {
        throw lastError || new Error('Could not find sheet with data');
      }

      console.log(`Using best range: ${bestRange} with ${maxRows} rows`);
    } catch (error) {
      console.error('Sheets API error:', error);
      return NextResponse.json({
        error: `Failed to access spreadsheet: ${error.message}`,
        details: 'Check if the sheet exists and you have permission to access it'
      }, { status: 500 });
    }

    const mainRows = mainResponse.data.values || [];
    const mainHeaders = mainRows[0] || [];
    const mainDataRows = mainRows.slice(1);

    // Map headers for easier access
    const getMainColumnValue = (row: string[], columnName: string) => {
      const index = mainHeaders.findIndex(h => h?.toLowerCase().includes(columnName.toLowerCase()));
      return index >= 0 ? (row[index] || '') : '';
    };

    // Get user's favorites and releases for marking
    const userIdentifier = session.user.email?.split('@')[0] || session.user.id;
    const favoritesWorksheet = `favorites_${userIdentifier}`;
    const releasesWorksheet = `releases_${userIdentifier}`;
    
    const getUserWorksheetData = async (worksheetName: string) => {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `${worksheetName}!${GALLERY_RANGE}`,
        });
        const rows = response.data.values || [];
        if (rows.length <= 1) return new Set();
        return new Set(rows.slice(1).map(row => row[0])); // Set of sheetRowIds
      } catch (error) {
        return new Set();
      }
    };

    const favoriteIds = await getUserWorksheetData(favoritesWorksheet);
    const releaseIds = await getUserWorksheetData(releasesWorksheet);

    // Get actual favorites count from the Favorites sheet
    let actualFavoritesCount = 0;
    let actualReleasesCount = 0;
    try {
      const favoritesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Favorites!A:A',
      });
      const favoritesRows = favoritesResponse.data.values || [];
      actualFavoritesCount = Math.max(0, favoritesRows.length - 1); // Subtract 1 for header row
      console.log('✅ Found Favorites sheet with', actualFavoritesCount, 'items');
    } catch (error) {
      console.log('No Favorites sheet found, count will be 0');
    }

    // Get actual PTR count from the PTR Tracking sheet
    try {
      const ptrResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'PTR Tracking!A:A',
      });
      const ptrRows = ptrResponse.data.values || [];
      actualReleasesCount = Math.max(0, ptrRows.length - 1); // Subtract 1 for header row
      console.log('✅ Found PTR Tracking sheet with', actualReleasesCount, 'items');
    } catch (error) {
      console.log('No PTR Tracking sheet found, count will be 0');
    }

    // Convert all main library data to items
    let items = mainDataRows.map((row, index) => {
      const sheetRowId = `row_${index + 2}`;
      const contentStyle = getMainColumnValue(row, 'content style') || getMainColumnValue(row, 'style');
      const creatorName = getMainColumnValue(row, 'creator') || getMainColumnValue(row, 'model');
      const captionText = getMainColumnValue(row, 'caption') || '';
      const priceStr = getMainColumnValue(row, 'price') || '0';
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      
      const performanceStr = getMainColumnValue(row, 'performance') || getMainColumnValue(row, 'buys') || '';
      const { totalBuys, totalRevenue } = parsePerformanceMetrics(performanceStr);

      // Determine if this item is in user's favorites/releases
      let contentType = 'LIBRARY'; // Default
      let isFavorite = favoriteIds.has(sheetRowId);
      let isRelease = releaseIds.has(sheetRowId);

      return {
        id: `library_${sheetRowId}_${index}`,
        sheetRowId,
        title: `${creatorName} - ${contentStyle}` || `Content ${index + 2}`,
        captionText,
        price,
        totalBuys,
        totalRevenue,
        category: determineCategoryFromStyle(contentStyle),
        dateAdded: new Date(), // Use current date for library items
        contentType: contentType,
        contentStyle,
        messageType: getMainColumnValue(row, 'message type') || getMainColumnValue(row, 'type'),
        gifUrl: getMainColumnValue(row, 'content') || getMainColumnValue(row, 'preview'),
        previewUrl: getMainColumnValue(row, 'content') || getMainColumnValue(row, 'preview'),
        usageCount: 0,
        lastUsed: null,
        notes: '',
        isFavorite,
        isRelease,
        creatorName
      };
    });

    // Apply filters
    if (filterType && filterType !== 'all') {
      if (filterType === 'favorites') {
        items = items.filter(item => item.isFavorite);
      } else if (filterType === 'releases') {
        items = items.filter(item => item.isRelease);
      }
    }

    if (category) {
      items = items.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }

    if (creator) {
      items = items.filter(item => item.creator && item.creator.toLowerCase().includes(creator.toLowerCase()));
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      items = items.filter(item => item.price >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      items = items.filter(item => item.price <= max);
    }

    if (minRevenue) {
      const min = parseFloat(minRevenue);
      items = items.filter(item => item.totalRevenue >= min);
    }

    if (query) {
      items = items.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.captionText.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.contentStyle.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort by performance (revenue) by default
    items.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Get total count before pagination
    const totalItems = items.length;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    // Calculate pagination info
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Get unique categories for filter options (from all items, not just paginated)
    const categories = [...new Set(mainDataRows.map(row => {
      const contentStyle = getMainColumnValue(row, 'content style') || getMainColumnValue(row, 'style');
      return determineCategoryFromStyle(contentStyle);
    }))].filter(Boolean);

    const result = {
      items: paginatedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, totalItems)
      },
      breakdown: {
        favorites: actualFavoritesCount, // From actual Favorites sheet
        releases: actualReleasesCount, // From actual PTR Tracking sheet
        library: mainDataRows.length // Total library items
      },
      categories: categories.map(cat => ({
        name: cat,
        count: items.filter(item => item.category === cat).length
      })),
      totalLibraryItems: mainDataRows.length
    };

    // Store result in memory cache
    memoryCache.set(cacheKey, result, 300000); // Cache for 5 minutes

    const response = NextResponse.json(result);

    // Add caching headers
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=300');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=300');
    
    console.log('💾 Cached result for', cacheKey);
    return response;
  } catch (error) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery content' },
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

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const sheetRowId = searchParams.get('rowId');
    const contentType = searchParams.get('type') || 'favorites';

    if (!sheetRowId) {
      return NextResponse.json({ error: 'Row ID required' }, { status: 400 });
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
    const galleryWorksheetName = `${contentType}_${session.user.email?.split('@')[0] || session.user.id}`;

    try {
      // Get current worksheet data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${galleryWorksheetName}!${GALLERY_RANGE}`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      // Find and remove the row
      const updatedRows = rows.filter((row, index) => {
        if (index === 0) return true; // Keep headers
        return row[0] !== sheetRowId; // Remove matching row
      });

      if (updatedRows.length === rows.length) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      // Update the worksheet
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: `${galleryWorksheetName}!${GALLERY_RANGE}`,
      });

      if (updatedRows.length > 1) { // Only update if there are rows besides headers
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${galleryWorksheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: updatedRows,
          },
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ 
        error: 'Gallery worksheet not found' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Gallery delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete gallery item' },
      { status: 500 }
    );
  }
}