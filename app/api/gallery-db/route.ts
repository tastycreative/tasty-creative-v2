import { NextRequest, NextResponse } from 'next/server'
import { 
  getAllTableNames, 
  getTableData, 
  searchTable,
  getTableSchema,
  DynamicTableRow,
  getUserFavorites,
  getReleases,
  isFavorited
} from '@/lib/supabase-dynamic'

/**
 * Extract purchase count from notes field like "0 Purchased", "5 Purchased", "11 Purchased", etc.
 */
function extractPurchasesFromNotes(notes: string): number {
  if (!notes) return 0
  
  // Look for patterns like "0 Purchased", "5 Purchased", "11 purchased", etc.
  const match = notes.match(/(\d+)\s*purchased/i)
  if (match) {
    return parseInt(match[1], 10) || 0
  }
  
  return 0
}

/**
 * Helper function to safely parse numbers from potentially unsafe input
 */
function parseNumber(value: any): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal points and negative signs
    const cleaned = value.replace(/[^0-9.-]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

// Cache configuration
export const revalidate = 300 // Cache for 5 minutes
export const dynamic = 'force-dynamic'
export const fetchCache = 'default-cache'

// Memory cache implementation
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
    } else {
      const keysToDelete: string[] = []
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key))
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }
    return true
  }
}

// Create singleton cache instance
const memoryCache = new MemoryCache()

// Helper function to paginate data
function paginateData(data: any, page: number, limit: number) {
  const totalItems = data.items.length
  const totalPages = Math.ceil(totalItems / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedItems = data.items.slice(startIndex, endIndex)

  return {
    ...data,
    items: paginatedItems,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      itemsPerPage: limit,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems)
    }
  }
}

/**
 * Gallery API that fetches data from Supabase database tables
 * instead of Google Sheets
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Get query parameters
    const fetchMode = searchParams.get('mode') || 'single' // 'single' or 'all'
    const tableName = searchParams.get('table') || 'gs_dakota_free' // For single mode
    const type = searchParams.get('type') || 'all'
    const category = searchParams.get('category')
    const creator = searchParams.get('creator')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minRevenue = searchParams.get('minRevenue')
    const messageType = searchParams.get('messageType')
    const outcome = searchParams.get('outcome')
    const captionStyle = searchParams.get('captionStyle')
    const q = searchParams.get('q') // Search query
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Create cache key based on all parameters (excluding timestamp for cache busting)
    const cacheKey = fetchMode === 'all' 
      ? `gallery-db:all:${JSON.stringify({
          type, category, creator, minPrice, maxPrice, minRevenue, messageType, outcome, captionStyle, q
        })}`
      : `gallery-db:${tableName}:${JSON.stringify({
          type, category, creator, minPrice, maxPrice, minRevenue, messageType, outcome, captionStyle, q
        })}`
    

    // Try to get from cache first (skip cache for favorites to ensure fresh data)
    // Also skip cache if explicitly requested via query param
    const forceRefresh = searchParams.get('forceRefresh') === 'true'
    const skipCache = type === 'favorites' || forceRefresh
    const cachedData = skipCache ? null : memoryCache.get<any>(cacheKey)
    if (cachedData) {
      const endTime = performance.now()
      
      // Return cached data without pagination - frontend handles pagination
      const response = {
        ...cachedData,
        pagination: {
          currentPage: 1,
          totalPages: Math.ceil((cachedData.items || []).length / limit),
          totalItems: (cachedData.items || []).length,
          hasNextPage: (cachedData.items || []).length > limit,
          hasPreviousPage: false,
          itemsPerPage: limit,
          startIndex: 1,
          endIndex: Math.min(limit, (cachedData.items || []).length)
        }
      }
      
      const headers = new Headers()
      headers.set('X-Cache', 'HIT')
      headers.set('X-Response-Time', `${Math.round(endTime - startTime)}ms`)
      headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
      
      return NextResponse.json(response, { headers })
    }

    // Get all available tables
    const allTables = await getAllTableNames()

    if (fetchMode === 'all') {
      // Fetch data from ALL tables
      const allTablesData: Record<string, any[]> = {}
      const allItems: any[] = []
      
      
      // Fetch favorites and releases data in parallel with table data
      const [favoritesResult, releasesResult] = await Promise.all([
        getUserFavorites('current-user'), // TODO: Get actual user ID from session
        getReleases()
      ])
      
      const favorites = favoritesResult.data || []
      const releases = releasesResult.data || []
      
      
      // Create lookup sets for performance
      const favoriteKeys = favorites.map(fav => `${fav.item_id}_${fav.table_name}`);
      const favoritesSet = new Set(favoriteKeys);
      const releasesSet = new Set(
        releases.map(rel => `${rel.item_id}_${rel.table_name}`)
      )
      
      
      // Fetch data from each table in parallel
      const tablePromises = allTables.map(async (table) => {
        try {
          // Build base filters for this table
          const baseFilters: Record<string, any> = {
            // Temporarily show all message types to debug
            // 'message_type': ['PPV', 'PPV Follow Up']
          }
          
          // If user has selected a specific message type, use that instead
          if (messageType && messageType !== 'all') {
            baseFilters['message_type'] = messageType
          } else {
          }
          
          // Add other filters
          if (outcome && outcome !== 'all') {
            baseFilters['outcome'] = outcome
          }
          if (captionStyle && captionStyle !== 'all') {
            baseFilters['caption_style'] = captionStyle
          }
          
          const { data, error } = await getTableData(table, {
            filters: baseFilters,
            limit: 1000
            // Remove created_at ordering since tables don't have this column
          })
          
          if (error) {
            return { table, data: [] }
          }
          
          
          
          return { table, data: data || [] }
        } catch (err) {
          return { table, data: [] }
        }
      })
      
      const tableResults = await Promise.all(tablePromises)
      
      // Process and categorize data by table
      tableResults.forEach(({ table, data }) => {
        const transformedItems = data.map((row, index) => {
          const parseNumber = (value: any): number => {
            if (typeof value === 'number') return value
            if (typeof value === 'string') {
              const cleaned = value.replace(/[$,]/g, '')
              const num = parseFloat(cleaned)
              return isNaN(num) ? 0 : num
            }
            return 0
          }

          // Use table name prefix to ensure unique IDs across merged tables
          const rawId = row.id || row.raw_row_index || `row_${index}`
          const itemId = `${table}_${rawId}` // Unique ID format: tableName_rowId
          
          // Try multiple possible lookup keys to handle ID inconsistencies
          // Including both old format (for backward compatibility) and new format
          const possibleLookupKeys = [
            `${itemId}_${table}`, // New format: tableName_rowId_tableName
            `${rawId}_${table}`, // Old format: rowId_tableName (for existing favorites)
            `${row.id}_${table}`,
            `${row.raw_row_index}_${table}`,
            `${table}_row_${index}_${table}`
          ].filter(Boolean) // Remove any undefined/null entries
          
          const isFavorite = possibleLookupKeys.some(key => favoritesSet.has(key))
          const isRelease = possibleLookupKeys.some(key => releasesSet.has(key))
          
          
          
          return {
            id: itemId,
            sheetRowId: row.raw_row_index || itemId,
            title: row["content_style"] || row["message_type"] || `${table} Item ${index + 1}`,
            captionText: row["caption"] || '',
            price: parseNumber(row["price"]),
            totalBuys: extractPurchasesFromNotes(row["notes"] || ''), // Parse from notes like "0 Purchased"
            totalRevenue: parseNumber(row["price"]) * extractPurchasesFromNotes(row["notes"] || ''), // Calculate price * purchases
            category: determineCategoryFromStyle(row["content_style"] || ''),
            dateAdded: row.created_at || new Date().toISOString(),
            contentStyle: row["content_style"] || '',
            messageType: row["message_type"] || '',
            gifUrl: row["content_preview_url"] || row["content_preview"] || '',
            previewUrl: row["content_preview_url"] || row["content_preview"] || '',
            contentType: "LIBRARY" as const,
            notes: row["notes"] || '',
            isFavorite: isFavorite,
            isRelease: isRelease,
            isPTR: isRelease,
            creatorName: row["creator_name"] || getCreatorNameFromTable(table),
            tableName: table,
            // Additional fields from actual data
            scheduleTab: row["Schedule Tab"] || '',
            scheduledMM: row["Scheduled Date"] || '',
            scheduledMMISO: row["Scheduled Date"] || '',
            timePST: row["TIME PST"] || '',
            contentPreview: row["Image URL"] || row["Video URL"] || '',
            contentPreviewUrl: row["Image URL"] || row["Video URL"] || '',
            paywallContent: row["PAYWALL CONTENT"] || '',
            captionStyle: row["CAPTION STYLE"] || '',
            outcome: row["OUTCOME"] || '',
            addedAt: row.created_at || new Date().toISOString()
          }
        })
        
        allTablesData[table] = transformedItems
        allItems.push(...transformedItems)
      })
      
      
      // Apply filters to combined data
      let filteredItems = allItems
      
      // Apply all the same filters as single mode
      if (messageType && messageType !== 'all') {
        filteredItems = filteredItems.filter(item => 
          item.messageType?.toLowerCase() === messageType.toLowerCase()
        )
      }
      if (outcome && outcome !== 'all') {
        filteredItems = filteredItems.filter(item => 
          item.outcome?.toLowerCase() === outcome.toLowerCase()
        )
      }
      if (captionStyle && captionStyle !== 'all') {
        filteredItems = filteredItems.filter(item => 
          item.captionStyle?.toLowerCase() === captionStyle.toLowerCase()
        )
      }
      if (category && category !== 'all') {
        filteredItems = filteredItems.filter(item => 
          item.category.toLowerCase() === category.toLowerCase()
        )
      }
      if (minPrice) {
        const min = parseFloat(minPrice)
        filteredItems = filteredItems.filter(item => item.price >= min)
      }
      if (maxPrice) {
        const max = parseFloat(maxPrice)
        filteredItems = filteredItems.filter(item => item.price <= max)
      }
      if (minRevenue) {
        const min = parseFloat(minRevenue)
        filteredItems = filteredItems.filter(item => item.totalRevenue >= min)
      }
      if (q) {
        filteredItems = filteredItems.filter(item =>
          item.title.toLowerCase().includes(q.toLowerCase()) ||
          item.captionText.toLowerCase().includes(q.toLowerCase()) ||
          item.contentStyle.toLowerCase().includes(q.toLowerCase()) ||
          item.messageType.toLowerCase().includes(q.toLowerCase()) ||
          (item.outcome || '').toLowerCase().includes(q.toLowerCase()) ||
          (item.captionStyle || '').toLowerCase().includes(q.toLowerCase()) ||
          item.tableName.toLowerCase().includes(q.toLowerCase()) ||
          item.creatorName.toLowerCase().includes(q.toLowerCase())
        )
      }
      
      // Type filter
      if (type === 'favorites') {
        filteredItems = filteredItems.filter(item => item.isFavorite)
      } else if (type === 'releases') {
        filteredItems = filteredItems.filter(item => item.isRelease)
      }
      
      // Calculate categories breakdown
      const categories = filteredItems.reduce((acc: Record<string, number>, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      }, {})
      
      const categoryBreakdown = Object.entries(categories).map(([name, count]) => ({
        name,
        count
      }))
      
      // Calculate creators breakdown
      const creators = filteredItems.reduce((acc: Record<string, number>, item) => {
        if (item.creatorName) {
          acc[item.creatorName] = (acc[item.creatorName] || 0) + 1
        }
        return acc
      }, {})

      const creatorBreakdown = Object.entries(creators).map(([name, count]) => ({
        name,
        count
      }))
      
      // Calculate table breakdown
      const tableBreakdown = filteredItems.reduce((acc: Record<string, number>, item) => {
        acc[item.tableName] = (acc[item.tableName] || 0) + 1
        return acc
      }, {})
      
      const responseData = {
        items: filteredItems,
        tableData: allTablesData, // Raw data organized by table
        tableBreakdown, // Count of items per table after filtering
        pagination: {
          currentPage: 1,
          totalPages: Math.ceil(filteredItems.length / limit),
          totalItems: filteredItems.length,
          hasNextPage: filteredItems.length > limit,
          hasPreviousPage: false,
          itemsPerPage: limit,
          startIndex: 1,
          endIndex: Math.min(limit, filteredItems.length)
        },
        breakdown: {
          favorites: filteredItems.filter(item => item.isFavorite).length,
          releases: filteredItems.filter(item => item.isRelease).length,
          library: allItems.length
        },
        categories: categoryBreakdown,
        creators: creatorBreakdown,
        totalLibraryItems: allItems.length,
        currentTable: 'ALL_TABLES',
        availableTables: allTables,
        fetchMode: 'all'
      }
      
      // Cache the response data
      memoryCache.set(cacheKey, responseData, 5 * 60 * 1000) // 5 minutes
      
      // Return full data without pagination for frontend caching
      // Frontend will handle pagination client-side
      const response = {
        ...responseData,
        pagination: {
          currentPage: 1,
          totalPages: Math.ceil(filteredItems.length / limit),
          totalItems: filteredItems.length,
          hasNextPage: filteredItems.length > limit,
          hasPreviousPage: false,
          itemsPerPage: limit,
          startIndex: 1,
          endIndex: Math.min(limit, filteredItems.length)
        }
      }
      
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      
      
      const headers = new Headers()
      headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
      headers.set('X-Cache', 'MISS')
      headers.set('X-Response-Time', `${duration}ms`)
      headers.set('X-Tables-Processed', allTables.length.toString())
      headers.set('X-Total-Items', filteredItems.length.toString())
      
      return NextResponse.json(response, { headers })
      
    } else {
      // SINGLE TABLE MODE (existing logic)
      
      // Check if requested table exists
      if (!allTables.includes(tableName)) {
        
        return NextResponse.json({
          items: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPreviousPage: false
          },
          breakdown: {
            favorites: 0,
            releases: 0,
            library: 0
          },
          availableTables: allTables,
          message: `Table ${tableName} not found. Expected format: gs_tablename. Use 'availableTables' to see valid options.`
        })
      }

      // Fetch favorites and releases data in parallel
      const [favoritesResult, releasesResult] = await Promise.all([
        getUserFavorites('current-user'), // TODO: Get actual user ID from session
        getReleases()
      ])
      
      const favorites = favoritesResult.data || []
      const releases = releasesResult.data || []
      
      // Create lookup sets for performance
      const favoriteKeys = favorites.map(fav => `${fav.item_id}_${fav.table_name}`);
      const favoritesSet = new Set(favoriteKeys);
      const releasesSet = new Set(
        releases.map(rel => `${rel.item_id}_${rel.table_name}`)
      )
      

      // Fetch data from single table
      let items: DynamicTableRow[] = []
      
      if (q) {
        // For search, we need to get all results first then filter for PPV
        const { data, error } = await searchTable(tableName, q, 1000)
        if (error) {
          items = []
        } else {
          // Filter search results to only include PPV and PPV Follow Up
          items = (data || []).filter((item: any) => {
            const msgType = item['MESSAGE TYPE'] || ''
            return msgType === 'PPV' || msgType === 'PPV Follow Up'
          })
        }
      } else {
        const filters: Record<string, any> = {
          // Temporarily show all message types to debug
          // 'message_type': ['PPV', 'PPV Follow Up']
        }
        
        // Apply additional filters if provided
        if (messageType && messageType !== 'all') {
          // Override the PPV filter if user specifically selects a message type
          filters['message_type'] = messageType
        } else {
        }
        if (outcome && outcome !== 'all') {
          filters['outcome'] = outcome
        }
        if (captionStyle && captionStyle !== 'all') {
          filters['caption_style'] = captionStyle
        }
        
        const { data, error } = await getTableData(tableName, {
          filters,
          limit: 1000
          // Remove created_at ordering since tables don't have this column
        })
        
        if (error) {
        } else {
          items = data
        }
      }

    // Transform data to match gallery item structure
    const transformedItems = items.map((row, index) => {
      // Parse numeric values safely
      const parseNumber = (value: any): number => {
        if (typeof value === 'number') return value
        if (typeof value === 'string') {
          const cleaned = value.replace(/[$,]/g, '')
          const num = parseFloat(cleaned)
          return isNaN(num) ? 0 : num
        }
        return 0
      }

      // Use table name prefix to ensure unique IDs (consistent with multi-table mode)
      const rawId = row.id || row.raw_row_index || `row_${index}`
      const itemId = `${tableName}_${rawId}` // Unique ID format: tableName_rowId
      
      // Try multiple possible lookup keys to handle ID inconsistencies
      // Including both old format (for backward compatibility) and new format
      const possibleLookupKeys = [
        `${itemId}_${tableName}`, // New format: tableName_rowId_tableName
        `${rawId}_${tableName}`, // Old format: rowId_tableName (for existing favorites)
        `${row.id}_${tableName}`,
        `${row.raw_row_index}_${tableName}`,
        `row_${index}_${tableName}`
      ].filter(Boolean) // Remove any undefined/null entries
      
      const isFavorite = possibleLookupKeys.some(key => favoritesSet.has(key))
      const isRelease = possibleLookupKeys.some(key => releasesSet.has(key))
      
      return {
        id: itemId,
        sheetRowId: row.raw_row_index || (row.id || `row_${index}`),
        title: row["content_style"] || row["message_type"] || `Item ${index + 1}`,
        captionText: row["caption"] || '',
        price: parseNumber(row["price"]),
        totalBuys: extractPurchasesFromNotes(row["notes"] || ''), // Parse from notes like "0 Purchased"
        totalRevenue: parseNumber(row["price"]) * extractPurchasesFromNotes(row["notes"] || ''), // Calculate price * purchases
        category: determineCategoryFromStyle(row["content_style"] || ''),
        dateAdded: row.created_at || new Date().toISOString(),
        contentStyle: row["content_style"] || '',
        messageType: row["message_type"] || '',
        gifUrl: row["content_preview_url"] || row["content_preview"] || '',
        previewUrl: row["content_preview_url"] || row["content_preview"] || '',
        contentType: "LIBRARY" as const,
        notes: row["notes"] || '',
        isFavorite: isFavorite,
        isRelease: isRelease,
        isPTR: isRelease,
        creatorName: row["creator_name"] || getCreatorNameFromTable(tableName),
        tableName: tableName,
        // Additional fields from actual data
        scheduleTab: row["Schedule Tab"] || '',
        scheduledMM: row["Scheduled Date"] || '',
        scheduledMMISO: row["Scheduled Date"] || '',
        timePST: row["TIME PST"] || '',
        contentPreview: row["Image URL"] || row["Video URL"] || '',
        contentPreviewUrl: row["Image URL"] || row["Video URL"] || '',
        paywallContent: row["PAYWALL CONTENT"] || '',
        captionStyle: row["CAPTION STYLE"] || '',
        outcome: row["OUTCOME"] || '',
        addedAt: row.created_at || new Date().toISOString()
      }
    })

    // Apply client-side filters
    let filteredItems = transformedItems

    // Category filter
    if (category && category !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      )
    }

    // Price filters
    if (minPrice) {
      const min = parseFloat(minPrice)
      filteredItems = filteredItems.filter(item => item.price >= min)
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice)
      filteredItems = filteredItems.filter(item => item.price <= max)
    }

    // Revenue filter (using calculated totalRevenue)
    if (minRevenue) {
      const min = parseFloat(minRevenue)
      filteredItems = filteredItems.filter(item => item.totalRevenue >= min)
    }

    // Type filter (all, favorites, releases)
    if (type === 'favorites') {
      filteredItems = filteredItems.filter(item => item.isFavorite)
    } else if (type === 'releases') {
      filteredItems = filteredItems.filter(item => item.isRelease)
    }

    // Calculate categories breakdown
    const categories = filteredItems.reduce((acc: Record<string, number>, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})

    const categoryBreakdown = Object.entries(categories).map(([name, count]) => ({
      name,
      count
    }))

    // Calculate creators breakdown
    const creators = filteredItems.reduce((acc: Record<string, number>, item) => {
      if (item.creatorName) {
        acc[item.creatorName] = (acc[item.creatorName] || 0) + 1
      }
      return acc
    }, {})

    const creatorBreakdown = Object.entries(creators).map(([name, count]) => ({
      name,
      count
    }))

    // Pagination
    const totalItems = filteredItems.length
    const totalPages = Math.ceil(totalItems / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedItems = filteredItems.slice(startIndex, endIndex)

    // Get table schema for metadata
    const schema = await getTableSchema(tableName)
    
    const responseData = {
      items: filteredItems, // Store full filtered data for caching
      pagination: {
        currentPage: 1, // We'll paginate from cache
        totalPages: Math.ceil(filteredItems.length / limit),
        totalItems: filteredItems.length,
        hasNextPage: filteredItems.length > limit,
        hasPreviousPage: false,
        itemsPerPage: limit,
        startIndex: 1,
        endIndex: Math.min(limit, filteredItems.length)
      },
      breakdown: {
        favorites: filteredItems.filter(item => item.isFavorite).length,
        releases: filteredItems.filter(item => item.isRelease).length,
        library: transformedItems.length
      },
      categories: categoryBreakdown,
      creators: creatorBreakdown,
      totalLibraryItems: transformedItems.length,
      currentTable: tableName,
      availableTables: allTables,
      tableSchema: schema
    }

    // Cache the response data (without pagination)
    memoryCache.set(cacheKey, responseData, 5 * 60 * 1000) // 5 minutes

    // Return full data without pagination - frontend handles pagination
    const response = {
      ...responseData,
      pagination: {
        currentPage: 1,
        totalPages: Math.ceil(filteredItems.length / limit),
        totalItems: filteredItems.length,
        hasNextPage: filteredItems.length > limit,
        hasPreviousPage: false,
        itemsPerPage: limit,
        startIndex: 1,
        endIndex: Math.min(limit, filteredItems.length)
      }
    }

    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)


    // Add cache headers for performance
    const headers = new Headers()
    headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
    headers.set('X-Cache', 'MISS')
    headers.set('X-Response-Time', `${duration}ms`)
    headers.set('X-Table', tableName)
    headers.set('X-Total-Items', filteredItems.length.toString())

    return NextResponse.json(response, { headers })
    
    } // Close single table mode
  
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Failed to fetch gallery data from database',
        details: error instanceof Error ? error.message : 'Unknown error',
        items: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        breakdown: {
          favorites: 0,
          releases: 0,
          library: 0
        }
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint to switch between tables or manage data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, tableName } = body

    switch (action) {
      case 'listTables':
        const tables = await getAllTableNames()
        return NextResponse.json({ tables })

      case 'getSchema':
        if (!tableName) {
          return NextResponse.json({ error: 'Table name required' }, { status: 400 })
        }
        const schema = await getTableSchema(tableName)
        return NextResponse.json({ schema })

      case 'clearCache':
        const pattern = tableName ? `gallery-db:${tableName}` : 'gallery-db'
        memoryCache.invalidate(pattern)
        return NextResponse.json({ 
          success: true, 
          message: `Cache cleared for pattern: ${pattern}` 
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to determine category from content style
function determineCategoryFromStyle(contentStyle: string): string {
  const style = contentStyle.toLowerCase()
  
  if (style.includes('sextape') || style.includes('sex tape') || style.includes('ptr')) {
    return 'PTR'
  }
  if (style.includes('threesome') || style.includes('group') || style.includes('3some')) {
    return 'Group'
  }
  if (style.includes('masturbation') || style.includes('solo') || style.includes('dildo')) {
    return 'Solo'
  }
  if (style.includes('blowjob') || style.includes('bj') || style.includes('oral')) {
    return 'BJ'
  }
  if (style.includes('tease') || style.includes('strip') || style.includes('dance')) {
    return 'Tease'
  }
  
  return 'Other'
}

// Helper function to extract creator name from table name
function getCreatorNameFromTable(tableName: string): string {
  if (!tableName.startsWith('gs_')) return tableName
  
  // Remove 'gs_' prefix and split by underscores
  const parts = tableName.substring(3).split('_')
  
  // Convert to proper case
  const creatorName = parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
  
  return creatorName
}