import { NextResponse } from 'next/server'
import { getAllTableNames, getTableData } from '@/lib/supabase-dynamic'

export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to check table data
 */
export async function GET() {
  try {
    console.log('🔍 Debugging table data...')
    
    // Get all tables
    const allTables = await getAllTableNames()
    console.log('📊 Found tables:', allTables)
    
    // Check a few specific tables for data
    const tablesToCheck = ['gs_dakota_free', 'gs_dakota_paid', 'gs_emily_ray_free']
    const results: Record<string, any> = {}
    
    for (const tableName of tablesToCheck) {
      if (allTables.includes(tableName)) {
        console.log(`🔍 Checking table: ${tableName}`)
        
        // Get row count first
        const { data: countData, error: countError } = await getTableData(tableName, {
          select: 'count(*)',
          limit: 1
        })
        
        // Get first few rows
        const { data, error } = await getTableData(tableName, {
          limit: 3
        })
        
        results[tableName] = {
          exists: !error,
          rowCount: countData?.length || 0,
          sampleData: data || [],
          error: error || countError,
          dataTypes: data && data.length > 0 ? Object.keys(data[0]) : []
        }
        
        console.log(`📈 ${tableName}:`, {
          rows: data?.length || 0,
          error: error?.message || 'none',
          columns: data && data.length > 0 ? Object.keys(data[0]).length : 0
        })
      } else {
        results[tableName] = {
          exists: false,
          error: 'Table not found in schema'
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      tablesFound: allTables.length,
      allTables,
      detailedResults: results,
      summary: {
        totalTables: allTables.length,
        checkedTables: tablesToCheck.length
      }
    })
    
  } catch (error) {
    console.error('💥 Debug failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}