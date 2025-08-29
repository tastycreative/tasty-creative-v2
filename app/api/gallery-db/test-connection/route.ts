import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-dynamic'

export async function GET() {
  try {
    console.log('🧪 Testing basic Supabase connection...')
    
    // Test 1: Basic connection
    console.log('🔗 Supabase Admin Client:', {
      url: 'https://zmfwpbokcpzflztcetaw.supabase.co',
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      keyPreview: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...'
    })
    
    // Test 2: Simple query
    console.log('📊 Testing simple query...')
    const { data: testData, error: testError } = await supabaseAdmin
      .from('information_schema.schemata')
      .select('schema_name')
      .limit(5)
    
    console.log('📊 Schema query result:', { testData, testError })
    
    // Test 3: Try to list tables in public schema
    console.log('🗂️ Testing table listing...')
    const { data: tablesData, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .limit(10)
    
    console.log('🗂️ Tables query result:', { tablesData, tablesError })
    
    // Test 4: Check if any gs_ tables exist
    if (tablesData && !tablesError) {
      const gsTables = tablesData.filter((t: any) => 
        t.table_name.startsWith('gs_')
      )
      console.log('🎯 Found gs_ tables:', gsTables)
    }
    
    return NextResponse.json({
      success: true,
      connectionTest: {
        basicConnection: !testError,
        schemasFound: testData?.length || 0,
        tablesQuerySuccess: !tablesError,
        totalTablesFound: tablesData?.length || 0,
        gsTablesFound: tablesData?.filter((t: any) => t.table_name.startsWith('gs_')).length || 0
      },
      rawResults: {
        schemas: testData,
        tables: tablesData,
        errors: {
          schemaError: testError,
          tablesError: tablesError
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        stack: error instanceof Error ? error.stack : null,
        environmentCheck: {
          hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          nodeEnv: process.env.NODE_ENV
        }
      }
    }, { status: 500 })
  }
}