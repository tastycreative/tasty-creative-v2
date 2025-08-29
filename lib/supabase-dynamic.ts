import { createClient } from '@supabase/supabase-js'

// Note: You need to replace [YOUR-PASSWORD] in .env with your actual Supabase password
const supabaseUrl = 'https://zmfwpbokcpzflztcetaw.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '' // Add this to your .env
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '' // Add this to your .env for admin operations

// Create Supabase client with service role for admin operations (bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Regular client for user operations
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

/**
 * Dynamic table interface - tables will have any typed columns
 * since they're based on dynamic spreadsheet data
 */
export interface DynamicTableRow {
  id?: string
  [key: string]: any // Dynamic columns from spreadsheet
}

/**
 * Fetch all table names from Supabase database
 */
export async function getAllTableNames(): Promise<string[]> {
  try {
    // First try: information_schema approach
    const { data, error } = await supabaseAdmin
      .from('information_schema.tables' as any)
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'in', '(schema_migrations)')

    if (error) {
      // Alternative approach using raw SQL
      const { data: tables, error: sqlError } = await supabaseAdmin.rpc('get_all_tables', {})
      
      if (sqlError) {
        return []
      }
      
      // Handle case where RPC returns objects with table_name property
      if (Array.isArray(tables) && tables.length > 0 && typeof tables[0] === 'object' && 'table_name' in tables[0]) {
        return tables.map((t: any) => t.table_name)
      }
      return tables || []
    }

    const tableNames = data?.map((t: any) => t.table_name) || []
    return tableNames
  } catch (err) {
    return []
  }
}

/**
 * Get data from a dynamic table (based on sheet name)
 * @param tableName - Name of the table (e.g., 'DAKOTA_FREE')
 * @param options - Query options
 */
export async function getTableData(
  tableName: string,
  options?: {
    select?: string
    filters?: Record<string, any>
    limit?: number
    offset?: number
    orderBy?: { column: string; ascending?: boolean }
  }
): Promise<{ data: DynamicTableRow[], error: any }> {
  try {
    let query = supabaseAdmin.from(tableName).select(options?.select || '*')

    // Apply filters if provided
    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null) {
          // Handle array values with .in() and single values with .eq()
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else {
            query = query.eq(key, value)
          }
        }
      }
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
    }

    const { data, error } = await query

    if (error) {
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    return { data: [], error: err }
  }
}

/**
 * Insert data into a dynamic table
 */
export async function insertTableData(
  tableName: string,
  data: DynamicTableRow | DynamicTableRow[]
): Promise<{ data: DynamicTableRow[], error: any }> {
  try {
    const { data: insertedData, error } = await supabaseAdmin
      .from(tableName)
      .insert(data)
      .select()

    if (error) {
      return { data: [], error }
    }

    return { data: insertedData || [], error: null }
  } catch (err) {
    return { data: [], error: err }
  }
}

/**
 * Update data in a dynamic table
 */
export async function updateTableData(
  tableName: string,
  id: string | number,
  updates: Partial<DynamicTableRow>
): Promise<{ data: DynamicTableRow[], error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()

    if (error) {
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    return { data: [], error: err }
  }
}

/**
 * Delete data from a dynamic table
 */
export async function deleteTableData(
  tableName: string,
  id: string | number
): Promise<{ error: any }> {
  try {
    const { error } = await supabaseAdmin
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) {
      return { error }
    }

    return { error: null }
  } catch (err) {
    return { error: err }
  }
}

/**
 * Get table schema/columns information
 */
export async function getTableSchema(tableName: string): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_table_columns', {
      table_name: tableName
    })

    if (error) {
      return []
    }

    return data || []
  } catch (err) {
    return []
  }
}

/**
 * Create a new table dynamically based on sheet structure
 */
export async function createTableFromSheet(
  tableName: string,
  columns: Array<{ name: string; type?: string }>
): Promise<{ success: boolean; error: any }> {
  try {
    // Build column definitions with all columns as TEXT by default
    // since spreadsheet data can be unpredictable
    const columnDefs = columns
      .map(col => `"${col.name}" ${col.type || 'TEXT'}`)
      .join(', ')

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        id SERIAL PRIMARY KEY,
        ${columnDefs},
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    const { error } = await supabaseAdmin.rpc('execute_sql', {
      query: createTableSQL
    })

    if (error) {
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: err }
  }
}

/**
 * Batch operations for better performance
 */
export async function batchInsert(
  tableName: string,
  rows: DynamicTableRow[]
): Promise<{ data: DynamicTableRow[], error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .insert(rows)
      .select()

    if (error) {
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    return { data: [], error: err }
  }
}

/**
 * Search across all columns in a table
 */
export async function searchTable(
  tableName: string,
  searchTerm: string,
  limit: number = 50
): Promise<{ data: DynamicTableRow[], error: any }> {
  try {
    // This will search across all text columns
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .textSearch('*', searchTerm, {
        type: 'plain',
        config: 'english'
      })
      .limit(limit)

    if (error) {
      // Fallback to basic ILIKE search on all columns
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .or(`*::text.ilike.%${searchTerm}%`)
        .limit(limit)

      if (fallbackError) {
        return { data: [], error: fallbackError }
      }

      return { data: fallbackData || [], error: null }
    }

    return { data: data || [], error: null }
  } catch (err) {
    return { data: [], error: err }
  }
}

// ===== FAVORITES MANAGEMENT =====

/**
 * Add item to user favorites
 */
export async function addToFavorites(
  userId: string,
  itemId: string,
  tableName: string,
  title: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .insert({
        user_id: userId,
        item_id: itemId,
        table_name: tableName,
        title
      })
      .select()

    if (error) {
      // Handle duplicate constraint error gracefully
      if (error.code === '23505') {
        return { success: true } // Already favorited, treat as success
      }
      return { success: false, error }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err }
  }
}

/**
 * Remove item from user favorites
 */
export async function removeFromFavorites(
  userId: string,
  itemId: string,
  tableName: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('table_name', tableName)

    if (error) {
      return { success: false, error }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err }
  }
}

/**
 * Get user's favorites
 */
export async function getUserFavorites(
  userId: string
): Promise<{ data: any[], error?: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error }
    }

    return { data: data || [] }
  } catch (err) {
    return { data: [], error: err }
  }
}

/**
 * Check if item is favorited by user
 */
export async function isFavorited(
  userId: string,
  itemId: string,
  tableName: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('table_name', tableName)
      .limit(1)

    if (error) {
      return false
    }

    return (data?.length || 0) > 0
  } catch (err) {
    return false
  }
}

// ===== PTR/RELEASES MANAGEMENT =====

/**
 * Mark item as PTR/Release
 */
export async function markAsRelease(
  itemId: string,
  tableName: string,
  title: string,
  markedBy: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ptr_tracking')
      .insert({
        item_id: itemId,
        table_name: tableName,
        title,
        marked_by: markedBy
      })
      .select()

    if (error) {
      // Handle duplicate constraint error gracefully
      if (error.code === '23505') {
        return { success: true } // Already marked, treat as success
      }
      return { success: false, error }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err }
  }
}

/**
 * Get all PTR/Release items
 */
export async function getReleases(): Promise<{ data: any[], error?: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ptr_tracking')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error }
    }

    return { data: data || [] }
  } catch (err) {
    return { data: [], error: err }
  }
}