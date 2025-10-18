import { NextRequest, NextResponse } from "next/server";
import {
  getTableData,
  searchTable,
  DynamicTableRow,
} from "@/lib/supabase-dynamic";

/**
 * Extract purchase count from notes field
 */
function extractPurchasesFromNotes(notes: string): number {
  if (!notes) return 0;

  const match = notes.match(/(\d+)\s*purchased/i);
  if (match) {
    return parseInt(match[1], 10) || 0;
  }

  return 0;
}

/**
 * Helper function to safely parse numbers
 */
function parseNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Memory cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
    } else {
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => this.cache.delete(key));
    }
  }
}

const memoryCache = new MemoryCache();

// Available gallery tables (hardcoded for better performance and reliability)
const AVAILABLE_TABLES = [
  "gs_bentlee_paid",
  "gs_dakota_free",
  "gs_dakota_paid",
  "gs_emily_ray_free",
  "gs_grace_free",
  "gs_grace_paid",
  "gs_hailey_w_free",
  "gs_hailey_w_paid",
  "gs_jane_free",
  "gs_jane_paid",
  "gs_kylie_free",
  "gs_kylie_paid",
  "gs_nika_free",
  "gs_nika_paid",
  "gs_oakly_free",
  "gs_oakly_paid",
  "gs_rae_paid",
  "gs_sharna_free",
  "gs_sharna_paid",
  "gs_zoe_free",
  "gs_zoe_paid",
];

/**
 * Smart table name matching
 * Finds the best matching table for a given model name
 */
function findMatchingTable(modelName: string): string[] {
  if (!modelName) return [];

  const cleanModelName = modelName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const matches: { table: string; score: number }[] = [];

  for (const table of AVAILABLE_TABLES) {
    const tableModelName = table.replace("gs_", "").replace(/_free|_paid/g, "");
    const cleanTableName = tableModelName.replace(/[^a-z0-9]/g, "");

    let score = 0;

    // Exact match (highest priority)
    if (cleanTableName === cleanModelName) {
      score = 100;
    }
    // Starts with (high priority)
    else if (cleanTableName.startsWith(cleanModelName)) {
      score = 80;
    }
    // Contains (medium priority)
    else if (cleanTableName.includes(cleanModelName)) {
      score = 60;
    }
    // Partial match (low priority)
    else if (
      cleanModelName.includes(cleanTableName) ||
      cleanTableName.includes(cleanModelName.substring(0, 4))
    ) {
      score = 40;
    }

    if (score > 0) {
      matches.push({ table, score });
    }
  }

  // Sort by score (highest first) and return table names
  return matches.sort((a, b) => b.score - a.score).map((match) => match.table);
}

/**
 * Get preferred table order for a model
 * Returns tables in order of preference (paid first, then free)
 */
function getPreferredTables(modelName: string): string[] {
  const matchingTables = findMatchingTable(modelName);

  // Separate paid and free tables
  const paidTables = matchingTables.filter((table) => table.includes("_paid"));
  const freeTables = matchingTables.filter((table) => table.includes("_free"));
  const otherTables = matchingTables.filter(
    (table) => !table.includes("_paid") && !table.includes("_free")
  );

  // Return in preferred order: paid first, then free, then others
  return [...paidTables, ...freeTables, ...otherTables];
}

// Cache configuration
export const revalidate = 300; // Cache for 5 minutes
export const dynamic = "force-dynamic";

/**
 * GET /api/gallery-db/model
 *
 * Fetches gallery data for a specific model
 *
 * Query Parameters:
 * - modelName: The model name (e.g., "Autumn")
 * - tableName: The table name (e.g., "gs_autumn") - optional, will be derived from modelName if not provided
 * - type: Filter by type (image, video, gif, all)
 * - category: Filter by category
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - messageType: Filter by message type
 * - outcome: Filter by outcome
 * - captionStyle: Filter by caption style
 * - q: Search query
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 * - sortBy: Sort field (default: created_at)
 * - sortOrder: Sort order (asc/desc, default: desc)
 * - forceRefresh: Force cache refresh (true/false)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    const searchParams = request.nextUrl.searchParams;

    // Get model-specific parameters
    const modelName = searchParams.get("modelName");
    let tableName = searchParams.get("tableName");

    // Validate required parameters
    if (!modelName && !tableName) {
      return NextResponse.json(
        { error: "Either modelName or tableName is required" },
        { status: 400 }
      );
    }

    // Get filter parameters first
    const type = searchParams.get("type") || "all";
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const messageType = searchParams.get("messageType");
    const outcome = searchParams.get("outcome");
    const captionStyle = searchParams.get("captionStyle");
    const q = searchParams.get("q"); // Search query
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Smart table matching - find the best matching tables
    let preferredTables: string[] = [];
    let matchedTableInfo: {
      attempted: string[];
      used?: string;
      matchScore?: number;
    } = { attempted: [] };

    if (!tableName && modelName) {
      // Use smart matching to find the best table(s)
      preferredTables = getPreferredTables(modelName);
      matchedTableInfo.attempted = preferredTables;

      if (preferredTables.length === 0) {
        return NextResponse.json({
          success: true,
          message: `No matching tables found for model: ${modelName}`,
          model: {
            name: modelName,
            table: null,
            matchInfo: {
              attempted: [],
              used: null,
            },
            alternativeTables: AVAILABLE_TABLES.filter(
              (t) =>
                t.startsWith("gs_") &&
                (t.includes("_free") || t.includes("_paid"))
            ),
            tableType: "unknown",
          },
          data: [],
          pagination: {
            page: 1,
            limit: limit,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
          stats: {
            total_items: 0,
            total_revenue: 0,
            total_purchases: 0,
            avg_price: "0.00",
            media_types: {
              images: 0,
              videos: 0,
              gifs: 0,
            },
          },
          filters: {
            type,
            category,
            minPrice,
            maxPrice,
            messageType,
            outcome,
            captionStyle,
            search: q,
          },
          cached: false,
          responseTime: `${(performance.now() - startTime).toFixed(2)}ms`,
        });
      } else {
        // Use the first (best matching) table
        tableName = preferredTables[0];
        matchedTableInfo.used = tableName;
      }
    } else if (tableName) {
      // Validate provided table name exists
      if (!AVAILABLE_TABLES.includes(tableName)) {
        return NextResponse.json(
          {
            error: `Table ${tableName} not found`,
            availableTables: AVAILABLE_TABLES,
          },
          { status: 404 }
        );
      }
      preferredTables = [tableName];
      matchedTableInfo.attempted = [tableName];
      matchedTableInfo.used = tableName;
    }

    const forceRefresh = searchParams.get("forceRefresh") === "true";

    // Create cache key based on all parameters
    const cacheKey = `model-gallery:${tableName}:${JSON.stringify({
      type,
      category,
      minPrice,
      maxPrice,
      messageType,
      outcome,
      captionStyle,
      q,
      sortBy,
      sortOrder,
      page,
      limit,
    })}`;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = memoryCache.get<any>(cacheKey);
      if (cachedData) {
        const endTime = performance.now();
        return NextResponse.json({
          ...cachedData,
          cached: true,
          responseTime: `${(endTime - startTime).toFixed(2)}ms`,
        });
      }
    }

    // Build filters object
    const filters: Record<string, any> = {};

    // Type filter (image, video, gif)
    if (type !== "all") {
      if (type === "image") {
        filters.type = ["image", "img", "photo", "pic", "picture"];
      } else if (type === "video") {
        filters.type = ["video", "vid", "mp4", "mov", "clip"];
      } else if (type === "gif") {
        filters.type = ["gif", "animated"];
      }
    }

    // Apply other filters
    if (category) filters.category = category;
    if (messageType) filters.message_type = messageType;
    if (outcome) filters.outcome = outcome;
    if (captionStyle) filters.caption_style = captionStyle;

    // Helper function to fetch data with proper parameters
    async function fetchTableData(table: string) {
      if (q && q.trim()) {
        // Use search functionality if query provided
        // Note: searchTable only accepts limit as a number
        return await searchTable(table, q, limit * page);
      } else {
        // Use regular table data fetch
        return await getTableData(table, {
          filters,
          limit: limit * page, // Get all data up to current page
          orderBy: { column: sortBy, ascending: sortOrder === "asc" },
        });
      }
    }

    // Try to fetch data from the best matching table
    let result: { data: DynamicTableRow[]; error: any };
    let usedTableName = tableName!;

    console.log(
      `Fetching data from table: ${tableName} for model: ${modelName}`
    );
    result = await fetchTableData(tableName!);

    if (result.error) {
      console.error(`Error fetching data from ${tableName}:`, result.error);
      return NextResponse.json(
        {
          error: "Failed to fetch model gallery data",
          details: result.error,
          table: tableName,
          matchInfo: matchedTableInfo,
        },
        { status: 500 }
      );
    }

    // If no data found, return empty result with matching info
    if (!result.data || result.data.length === 0) {
      return NextResponse.json({
        success: true,
        model: {
          name:
            modelName ||
            tableName?.replace("gs_", "").replace(/_free|_paid/g, ""),
          table: tableName,
          matchInfo: matchedTableInfo,
          alternativeTables: preferredTables.slice(1), // Show other options
        },
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
        stats: {
          total_items: 0,
          total_revenue: 0,
          total_purchases: 0,
          avg_price: "0",
          media_types: {
            images: 0,
            videos: 0,
            gifs: 0,
          },
        },
        filters: {
          type,
          category,
          minPrice,
          maxPrice,
          messageType,
          outcome,
          captionStyle,
          search: q,
        },
        cached: false,
        responseTime: `${(performance.now() - startTime).toFixed(2)}ms`,
      });
    }

    // Process data with minimal transformation - just return what's actually in the table
    const processedData = result.data.map((item: DynamicTableRow) => {
      // Extract purchase count from notes if available
      const purchases = extractPurchasesFromNotes(item.notes || "");

      // Parse numeric values exactly as they are in the table
      const price = parseNumber(item.price || item.pricing || 0);
      const revenue = parseNumber(item.revenue || 0);

      // Determine media type from file extension if URL exists
      let mediaType = "image";
      const fileUrl = item.media_url || item.url || "";
      if (fileUrl) {
        const extension = fileUrl.toLowerCase();
        if (extension.includes(".mp4") || extension.includes(".mov") || extension.includes(".webm")) {
          mediaType = "video";
        } else if (extension.includes(".gif")) {
          mediaType = "gif";
        }
      }

      // Calculate engagement rate only if we have actual data
      let engagementRate = 0;
      if (item.likes && item.views && item.views > 0) {
        engagementRate = (item.likes / item.views) * 100;
      } else if (item.engagement_rate) {
        engagementRate = parseNumber(item.engagement_rate);
      }

      return {
        ...item,
        id: item.id || `${tableName}_${Math.random().toString(36).substring(2, 9)}`,
        table_name: tableName,
        model_name: modelName || tableName?.replace("gs_", "").replace(/_free|_paid/g, ""),
        media_type: mediaType,
        media_url: item.media_url || item.url || item.content_preview_url,
        thumbnail_url: item.thumbnail_url,
        purchases,
        price,
        revenue,
        engagement_rate: engagementRate,
        avg_purchase_value: purchases > 0 ? (revenue / purchases) : 0,
        caption: item.caption || "",
      };
    });

    // Apply price filters after processing
    let filteredData = processedData;
    if (minPrice) {
      const min = parseNumber(minPrice);
      filteredData = filteredData.filter((item) => item.price >= min);
    }
    if (maxPrice) {
      const max = parseNumber(maxPrice);
      filteredData = filteredData.filter((item) => item.price <= max);
    }

    // Calculate statistics
    const stats = {
      total_items: filteredData.length,
      total_revenue: filteredData.reduce((sum, item) => sum + item.revenue, 0),
      total_purchases: filteredData.reduce(
        (sum, item) => sum + item.purchases,
        0
      ),
      avg_price:
        filteredData.length > 0
          ? (
              filteredData.reduce((sum, item) => sum + item.price, 0) /
              filteredData.length
            ).toFixed(2)
          : 0,
      media_types: {
        images: filteredData.filter((item) => item.media_type === "image")
          .length,
        videos: filteredData.filter((item) => item.media_type === "video")
          .length,
        gifs: filteredData.filter((item) => item.media_type === "gif").length,
      },
    };

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Prepare response
    const response = {
      success: true,
      model: {
        name:
          modelName ||
          tableName?.replace("gs_", "").replace(/_free|_paid/g, ""),
        table: tableName,
        matchInfo: matchedTableInfo,
        alternativeTables: preferredTables.slice(1), // Show other matching tables
        tableType: tableName?.includes("_paid")
          ? "paid"
          : tableName?.includes("_free")
            ? "free"
            : "other",
      },
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / limit),
        hasMore: endIndex < filteredData.length,
      },
      stats,
      filters: {
        type,
        category,
        minPrice,
        maxPrice,
        messageType,
        outcome,
        captionStyle,
        search: q,
      },
      cached: false,
      responseTime: `${(performance.now() - startTime).toFixed(2)}ms`,
    };

    // Cache the response (for 5 minutes)
    memoryCache.set(cacheKey, response, 5 * 60 * 1000);

    const endTime = performance.now();
    response.responseTime = `${(endTime - startTime).toFixed(2)}ms`;

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in model gallery API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gallery-db/model
 *
 * Invalidate cache for a specific model or get available tables
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, modelName, action } = body;

    // Handle different actions
    if (action === "listTables") {
      return NextResponse.json({
        success: true,
        availableTables: AVAILABLE_TABLES,
        modelTables: AVAILABLE_TABLES.filter(
          (t) =>
            t.startsWith("gs_") && (t.includes("_free") || t.includes("_paid"))
        ),
      });
    }

    if (action === "findMatches" && modelName) {
      const matches = getPreferredTables(modelName);
      return NextResponse.json({
        success: true,
        modelName,
        matches,
        recommended: matches[0] || null,
      });
    }

    // Default: invalidate cache
    if (!tableName && !modelName) {
      return NextResponse.json(
        {
          error:
            "Either tableName or modelName is required for cache invalidation",
        },
        { status: 400 }
      );
    }

    let tablesToInvalidate: string[] = [];

    if (tableName) {
      tablesToInvalidate = [tableName];
    } else if (modelName) {
      // Find all matching tables for this model
      tablesToInvalidate = getPreferredTables(modelName);
    }

    // Invalidate cache for all matching tables
    tablesToInvalidate.forEach((table) => {
      memoryCache.invalidate(`model-gallery:${table}`);
    });

    return NextResponse.json({
      success: true,
      message: `Cache invalidated for ${tablesToInvalidate.length} table(s)`,
      invalidatedTables: tablesToInvalidate,
    });
  } catch (error) {
    console.error("Error in POST /api/gallery-db/model:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
