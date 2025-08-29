import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-dynamic'

export const dynamic = 'force-dynamic'

/**
 * Test Supabase connection and basic functionality
 */
export async function GET() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test 1: Check if we can call the get_all_tables function
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc('get_all_tables')
    
    if (tablesError) {
      console.error('❌ get_all_tables failed:', tablesError)
      return NextResponse.json({
        success: false,
        error: 'get_all_tables function failed',
        details: tablesError,
        suggestion: 'Run the SQL setup script in Supabase SQL Editor'
      }, { status: 500 })
    }
    
    console.log('✅ Tables found:', tables)
    
    // Test 2: Check if system tables exist
    const { data: favoritesTest, error: favError } = await supabaseAdmin
      .from('user_favorites')
      .select('count(*)')
      .limit(1)
    
    const { data: ptrTest, error: ptrError } = await supabaseAdmin
      .from('ptr_tracking')
      .select('count(*)')
      .limit(1)
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      tablesFound: tables?.length || 0,
      tables: tables || [],
      systemTables: {
        user_favorites: favError ? 'MISSING' : 'OK',
        ptr_tracking: ptrError ? 'MISSING' : 'OK'
      },
      errors: {
        favorites: favError,
        ptr: ptrError
      }
    })
    
  } catch (error) {
    console.error('💥 Supabase test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}