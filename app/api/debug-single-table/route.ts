import { NextResponse } from 'next/server'
import { getTableData } from '@/lib/supabase-dynamic'

export const dynamic = 'force-dynamic'

/**
 * Debug a single table to see exactly what's happening
 */
export async function GET() {
  try {
    console.log('🔍 Testing single table data fetch...')
    
    const tableName = 'gs_dakota_free'
    
    // Test the exact same call the gallery API makes
    console.log(`🔍 Fetching from ${tableName} with limit 1000`)
    
    const { data, error } = await getTableData(tableName, {
      limit: 1000
    })
    
    console.log('📊 Raw result:', {
      dataLength: data?.length || 0,
      error: error ? error.message : 'none',
      firstRowSample: data && data.length > 0 ? data[0] : null
    })
    
    if (error) {
      return NextResponse.json({
        success: false,
        tableName,
        error,
        message: 'Failed to fetch data'
      })
    }
    
    // Show transformation process
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

      const itemId = row.id || row.raw_row_index || `${tableName}_row_${index}`
      
      return {
        id: itemId,
        sheetRowId: row.raw_row_index || itemId,
        title: row.content_style || row.message_type || `${tableName} Item ${index + 1}`,
        captionText: row.caption || '',
        price: parseNumber(row.price),
        totalBuys: 0,
        totalRevenue: parseNumber(row.price) * 0,
        category: 'Other', // Simplified for debug
        dateAdded: new Date().toISOString(),
        contentStyle: row.content_style || '',
        messageType: row.message_type || '',
        previewUrl: row.content_preview_url || '',
        outcome: row.outcome || '',
        tableName: tableName,
        // Raw data for comparison
        rawData: row
      }
    })
    
    return NextResponse.json({
      success: true,
      tableName,
      rawDataCount: data?.length || 0,
      transformedCount: transformedItems.length,
      sampleRawData: data?.slice(0, 2) || [],
      sampleTransformed: transformedItems.slice(0, 2) || [],
      allTransformed: transformedItems
    })
    
  } catch (error) {
    console.error('💥 Single table debug failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}