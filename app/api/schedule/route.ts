import { NextRequest, NextResponse } from 'next/server'
import { getTableData } from '@/lib/supabase-dynamic'
import type { ScheduledContent, ScheduleResponse, ScheduleStats } from '@/types/schedule'

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
}

// Create singleton cache instance
const memoryCache = new MemoryCache()

/**
 * Determine if content is scheduled or published based on date
 */
function determineStatus(scheduledDate: string | null): 'scheduled' | 'published' {
  if (!scheduledDate) return 'scheduled'

  try {
    const date = new Date(scheduledDate)
    const now = new Date()
    // Set now to start of day for comparison
    now.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    return date < now ? 'published' : 'scheduled'
  } catch {
    return 'scheduled'
  }
}

/**
 * Count items by a specific field
 */
function countByField(items: any[], field: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = item[field] || 'Unknown'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

/**
 * Schedule API - Fetches scheduled content from gs_mastersheet_db_combined table
 *
 * Query Parameters:
 * - sheetname: Filter by creator/model name
 * - schedule_tab: Filter by schedule variant (e.g., "Schedule #1A")
 * - message_type: Filter by message type (PPV, PPV Follow Up, Sexting Set Bump)
 * - content_style: Filter by content style
 * - outcome: Filter by outcome
 * - dateFrom: Filter by start date (scheduled_mm_iso >= dateFrom)
 * - dateTo: Filter by end date (scheduled_mm_iso <= dateTo)
 * - q: Search query (searches in caption, notes, sheetname, message_type)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now()

  try {
    const searchParams = request.nextUrl.searchParams

    // Get query parameters
    const page = searchParams.get('page')
    const scheduleTab = searchParams.get('schedule_tab')
    const messageType = searchParams.get('message_type')
    const type = searchParams.get('type')
    const contentStyle = searchParams.get('content_style')
    const outcome = searchParams.get('outcome')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const q = searchParams.get('q')
    const pageNumber = parseInt(searchParams.get('pageNumber') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Create cache key based on all parameters
    const cacheKey = `schedule:${JSON.stringify({
      page, scheduleTab, messageType, type, contentStyle, outcome, dateFrom, dateTo, q
    })}`

    // Try to get from cache first
    const forceRefresh = searchParams.get('forceRefresh') === 'true'
    const cachedData = forceRefresh ? null : memoryCache.get<ScheduleResponse>(cacheKey)

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

    if (page) filters['page'] = page
    if (scheduleTab) filters['schedule_tab'] = scheduleTab
    if (messageType) filters['message_type'] = messageType
    if (type) filters['type'] = type
    if (contentStyle) filters['content_style'] = contentStyle
    if (outcome) filters['outcome'] = outcome

    // Fetch data from Supabase
    const { data, error } = await getTableData('combined_master_table', {
      filters,
      limit: 1000,
      orderBy: { column: 'scheduled_date', ascending: true }
    })

    if (error) {
      console.error('Error fetching schedule data:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch schedule data',
          details: error,
          items: [],
          stats: {
            total: 0,
            byMessageType: {},
            byPage: {},
            byScheduleTab: {},
            byType: {},
            byOutcome: {}
          },
          availablePages: [],
          availableScheduleTabs: [],
          availableMessageTypes: [],
          availableTypes: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPreviousPage: false,
            itemsPerPage: limit
          }
        } as ScheduleResponse,
        { status: 500 }
      )
    }

    // Transform data to match ScheduledContent interface
    const items: ScheduledContent[] = (data || []).map((row: any, index: number) => ({
      id: row.id || `row_${index}`,
      page: row.page || 'Unknown',
      scheduleTab: row.schedule_tab || '',
      type: row.type || 'MM',
      scheduledDate: row.scheduled_date || '',
      timePST: row.time_pst || '',
      messageType: row.message_type || 'PPV',
      contentStyle: row.content_style || '',
      contentPreview: row.content_preview || '',
      paywallContent: row.paywall_content || '',
      caption: row.caption || '',
      captionStyle: row.caption_style || '',
      price: row.price || '',
      outcome: row.outcome || '',
      notes: row.notes || '',
      status: determineStatus(row.scheduled_date),
      createdAt: row.created_at || ''
    }))

    // Apply client-side filters
    let filteredItems = items

    // Date range filtering
    if (dateFrom) {
      filteredItems = filteredItems.filter(item => {
        if (!item.scheduledDate) return false
        return item.scheduledDate >= dateFrom
      })
    }

    if (dateTo) {
      filteredItems = filteredItems.filter(item => {
        if (!item.scheduledDate) return false
        return item.scheduledDate <= dateTo
      })
    }

    // Search filtering
    if (q) {
      const searchLower = q.toLowerCase()
      filteredItems = filteredItems.filter(item =>
        item.caption?.toLowerCase().includes(searchLower) ||
        item.page?.toLowerCase().includes(searchLower) ||
        item.messageType?.toLowerCase().includes(searchLower) ||
        item.notes?.toLowerCase().includes(searchLower) ||
        item.scheduleTab?.toLowerCase().includes(searchLower) ||
        item.paywallContent?.toLowerCase().includes(searchLower) ||
        item.contentStyle?.toLowerCase().includes(searchLower)
      )
    }

    // Calculate stats
    const stats: ScheduleStats = {
      total: filteredItems.length,
      byMessageType: countByField(filteredItems, 'messageType'),
      byPage: countByField(filteredItems, 'page'),
      byScheduleTab: countByField(filteredItems, 'scheduleTab'),
      byType: countByField(filteredItems, 'type'),
      byOutcome: countByField(filteredItems, 'outcome')
    }

    // Extract unique values for filters
    const availablePages = [...new Set(items.map(item => item.page).filter(Boolean))].sort()
    const availableScheduleTabs = [...new Set(items.map(item => item.scheduleTab).filter(Boolean))].sort()
    const availableMessageTypes = ['PPV', 'PPV Follow Up', 'Sexting Set Bump']
    const availableTypes = ['MM', 'Post']

    // Prepare response
    const response: ScheduleResponse = {
      items: filteredItems,
      stats,
      availablePages,
      availableScheduleTabs,
      availableMessageTypes,
      availableTypes,
      pagination: {
        currentPage: 1,
        totalPages: Math.ceil(filteredItems.length / limit),
        totalItems: filteredItems.length,
        hasNextPage: filteredItems.length > limit,
        hasPreviousPage: false,
        itemsPerPage: limit
      }
    }

    // Cache the response
    memoryCache.set(cacheKey, response, 5 * 60 * 1000) // 5 minutes

    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)

    const headers = new Headers()
    headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
    headers.set('X-Cache', 'MISS')
    headers.set('X-Response-Time', `${duration}ms`)
    headers.set('X-Total-Items', filteredItems.length.toString())

    return NextResponse.json(response, { headers })

  } catch (error) {
    console.error('Schedule API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch schedule data',
        details: error instanceof Error ? error.message : 'Unknown error',
        items: [],
        stats: {
          total: 0,
          byMessageType: {},
          byPage: {},
          byScheduleTab: {},
          byType: {},
          byOutcome: {}
        },
        availablePages: [],
        availableScheduleTabs: [],
        availableMessageTypes: [],
        availableTypes: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          itemsPerPage: 20
        }
      } as ScheduleResponse,
      { status: 500 }
    )
  }
}

/**
 * POST endpoint for cache management
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'clearCache':
        memoryCache.invalidate('schedule')
        return NextResponse.json({
          success: true,
          message: 'Schedule cache cleared'
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
