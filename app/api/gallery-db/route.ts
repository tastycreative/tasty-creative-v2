import { NextRequest, NextResponse } from 'next/server'
import {
  getTableData,
  getUserFavorites,
  getReleases,
} from '@/lib/supabase-dynamic'
import { GalleryItem } from '@/types/gallery'

/**
 * Extract revenue from notes field like "Earned 79.96", "Earned 12.50", etc.
 * Also supports legacy format "X Purchased"
 */
function extractRevenueFromNotes(notes: string): number {
  if (!notes) return 0

  // Primary pattern: "Earned X.XX" or "Earned X"
  const earnedMatch = notes.match(/earned\s+([\d.]+)/i)
  if (earnedMatch) {
    return parseFloat(earnedMatch[1]) || 0
  }

  // Legacy pattern: "X Purchased" (not used in current data)
  const purchasedMatch = notes.match(/(\d+)\s*purchased/i)
  if (purchasedMatch) {
    return parseInt(purchasedMatch[1], 10) || 0
  }

  return 0
}

/**
 * Helper function to safely parse numbers from potentially unsafe input
 */
function parseNumber(value: any): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Handle empty strings explicitly
    if (value.trim() === '') return 0
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

// Helper function to count by field
function countByField(items: any[], field: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = item[field] || 'Unknown'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

/**
 * Gallery API that fetches data from combined_master_table
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now()

  try {
    const searchParams = request.nextUrl.searchParams

    // Get query parameters
    const type = searchParams.get('type') || 'all' // all, favorites, releases
    const category = searchParams.get('category')
    const creator = searchParams.get('creator')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minRevenue = searchParams.get('minRevenue')
    const messageType = searchParams.get('messageType')
    const outcome = searchParams.get('outcome')
    const contentStyle = searchParams.get('contentStyle')
    const contentType = searchParams.get('contentType') // MM or Post
    const q = searchParams.get('q') // Search query
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Create cache key based on all parameters
    const cacheKey = `gallery:${JSON.stringify({
      type, category, creator, minPrice, maxPrice, minRevenue,
      messageType, outcome, contentStyle, contentType, q
    })}`

    // Try to get from cache first (skip cache for favorites to ensure fresh data)
    const forceRefresh = searchParams.get('forceRefresh') === 'true'
    const skipCache = type === 'favorites' || forceRefresh
    const cachedData = skipCache ? null : memoryCache.get<any>(cacheKey)

    if (cachedData) {
      const endTime = performance.now()

      const headers = new Headers()
      headers.set('X-Cache', 'HIT')
      headers.set('X-Response-Time', `${Math.round(endTime - startTime)}ms`)
      headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')

      return NextResponse.json(cachedData, { headers })
    }

    // Build filters for Supabase query
    const filters: Record<string, any> = {}

    if (messageType && messageType !== 'all') filters['message_type'] = messageType
    if (outcome && outcome !== 'all') filters['outcome'] = outcome
    if (contentStyle && contentStyle !== 'all') filters['content_style'] = contentStyle
    if (contentType && contentType !== 'all') filters['type'] = contentType
    if (creator && creator !== 'all') filters['page'] = creator

    // Fetch data from combined_master_table
    const { data, error } = await getTableData('combined_master_table', {
      filters,
      limit: 1000,
      orderBy: { column: 'created_at', ascending: false }
    })

    if (error) {
      console.error('Error fetching gallery data:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch gallery data',
          details: error,
          items: [],
          stats: {
            total: 0,
            byMessageType: {},
            byPage: {},
            byCategory: {},
            byOutcome: {},
            byType: {}
          },
          breakdown: {
            favorites: 0,
            releases: 0,
            library: 0
          },
          categories: [],
          creators: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPreviousPage: false,
            itemsPerPage: limit
          }
        },
        { status: 500 }
      )
    }

    // Fetch favorites and releases data in parallel
    const [favoritesResult, releasesResult] = await Promise.all([
      getUserFavorites('current-user'),
      getReleases()
    ])

    const favorites = favoritesResult.data || []
    const releases = releasesResult.data || []

    // Create lookup sets for performance
    const favoritesSet = new Set(
      favorites.map(fav => `${fav.item_id}`)
    )
    const releasesSet = new Set(
      releases.map(rel => `${rel.item_id}`)
    )

    // Transform data to match GalleryItem structure
    const items: GalleryItem[] = (data || []).map((row: any, index: number) => {
      const itemId = row.id || `row_${index}`
      const price = parseNumber(row.price)

      // Extract revenue from notes (e.g., "Earned 79.96")
      const revenueFromNotes = extractRevenueFromNotes(row.notes || '')

      // Calculate total revenue: prioritize notes data, fallback to price × purchases
      const totalRevenue = revenueFromNotes > 0 ? revenueFromNotes : 0

      // Calculate purchases from revenue and price (reverse calculation)
      const purchases = price > 0 && totalRevenue > 0 ? Math.round(totalRevenue / price) : 0

      return {
        id: itemId.toString(),
        sheetRowId: itemId.toString(),
        title: row.content_style || row.message_type || `Item ${index + 1}`,
        captionText: row.caption || '',
        caption: row.caption || '',
        price: price,
        totalBuys: purchases,
        purchases: purchases,
        totalRevenue: totalRevenue,
        revenue: totalRevenue,
        category: determineCategoryFromStyle(row.content_style || ''),
        dateAdded: row.created_at || new Date().toISOString(),
        contentStyle: row.content_style || '',
        messageType: row.message_type || '',
        gifUrl: row.content_preview || '',
        previewUrl: row.content_preview || '',
        mediaUrl: row.content_preview || '',
        thumbnailUrl: row.content_preview || '',
        contentType: 'LIBRARY',
        notes: row.notes || '',
        isFavorite: favoritesSet.has(itemId.toString()),
        isRelease: releasesSet.has(itemId.toString()),
        isPTR: releasesSet.has(itemId.toString()),
        creatorName: row.page || 'Unknown',
        tableName: 'combined_master_table',
        scheduleTab: row.schedule_tab || '',
        type: row.type || '',
        timePST: row.time_pst || '',
        paywallContent: row.paywall_content || '',
        captionStyle: row.caption_style || '',
        outcome: row.outcome || '',
        scheduledDate: row.scheduled_date || ''
      }
    })

    // Apply client-side filters
    let filteredItems = items

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

    // Revenue filter
    if (minRevenue) {
      const min = parseFloat(minRevenue)
      filteredItems = filteredItems.filter(item => item.totalRevenue >= min)
    }

    // Search filter
    if (q) {
      const searchLower = q.toLowerCase()
      filteredItems = filteredItems.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.captionText.toLowerCase().includes(searchLower) ||
        item.contentStyle?.toLowerCase().includes(searchLower) ||
        item.messageType?.toLowerCase().includes(searchLower) ||
        item.outcome?.toLowerCase().includes(searchLower) ||
        item.captionStyle?.toLowerCase().includes(searchLower) ||
        item.creatorName?.toLowerCase().includes(searchLower) ||
        item.paywallContent?.toLowerCase().includes(searchLower)
      )
    }

    // Type filter (all, favorites, releases)
    if (type === 'favorites') {
      filteredItems = filteredItems.filter(item => item.isFavorite)
    } else if (type === 'releases') {
      filteredItems = filteredItems.filter(item => item.isRelease)
    }

    // Calculate stats
    const stats = {
      total: filteredItems.length,
      byMessageType: countByField(filteredItems, 'messageType'),
      byPage: countByField(filteredItems, 'creatorName'),
      byCategory: countByField(filteredItems, 'category'),
      byOutcome: countByField(filteredItems, 'outcome'),
      byType: countByField(filteredItems, 'type')
    }

    // Extract unique values for filters
    const categories = Object.entries(stats.byCategory).map(([name, count]) => ({
      name,
      count: count as number
    }))

    const creators = Object.entries(stats.byPage).map(([name, count]) => ({
      name,
      count: count as number
    }))

    // Prepare response
    const responseData = {
      items: filteredItems,
      stats,
      breakdown: {
        favorites: favorites.length,
        releases: releases.length,
        library: items.length
      },
      categories,
      creators,
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

    // Cache the response data
    memoryCache.set(cacheKey, responseData, 5 * 60 * 1000) // 5 minutes

    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)

    const headers = new Headers()
    headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
    headers.set('X-Cache', 'MISS')
    headers.set('X-Response-Time', `${duration}ms`)
    headers.set('X-Total-Items', filteredItems.length.toString())

    return NextResponse.json(responseData, { headers })

  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch gallery data from database',
        details: error instanceof Error ? error.message : 'Unknown error',
        items: [],
        stats: {
          total: 0,
          byMessageType: {},
          byPage: {},
          byCategory: {},
          byOutcome: {},
          byType: {}
        },
        breakdown: {
          favorites: 0,
          releases: 0,
          library: 0
        },
        categories: [],
        creators: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          itemsPerPage: 20
        }
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint to manage cache
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'clearCache':
        memoryCache.invalidate('gallery')
        return NextResponse.json({
          success: true,
          message: 'Gallery cache cleared'
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
