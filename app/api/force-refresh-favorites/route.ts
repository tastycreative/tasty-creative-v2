import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-dynamic';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Force refresh favorites count from database
 * This bypasses all caching to get the real count
 */
export async function GET() {
  try {
    // Direct query to Supabase, no caching
    const { data: favorites, error, count } = await supabaseAdmin
      .from('user_favorites')
      .select('*', { count: 'exact' })
      .eq('user_id', 'current-user')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    // Get unique items with details
    const items = favorites?.map(f => ({
      id: f.id,
      item_id: f.item_id,
      table_name: f.table_name,
      title: f.title,
      created_at: f.created_at
    })) || [];

    // Group by table
    const byTable = items.reduce((acc: any, item) => {
      acc[item.table_name] = (acc[item.table_name] || 0) + 1;
      return acc;
    }, {});

    const response = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        url: 'https://zmfwpbokcpzflztcetaw.supabase.co',
        user_id: 'current-user'
      },
      favorites: {
        total_count: count || favorites?.length || 0,
        items: items,
        by_table: byTable
      },
      cache_info: {
        cache_control: 'no-store',
        message: 'This endpoint bypasses all caching'
      }
    });

    // Ensure no caching at all
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch favorites',
      details: error?.message || 'Unknown error',
      stack: error?.stack
    }, { status: 500 });
  }
}