import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/ptr-sent
 * Marks a PTR (Pay-to-Release) item as sent
 *
 * Request body:
 * - itemId: string - The raw item ID (without table prefix)
 * - tableName: string - The source table name
 * - userId: string - The user marking the item as sent
 *
 * Response:
 * - 200: Success
 * - 400: Bad request (missing parameters)
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, tableName, userId } = body;

    // Validate required fields
    if (!itemId || !tableName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, tableName, userId' },
        { status: 400 }
      );
    }

    // Update the item in the source table
    const { data, error } = await supabase
      .from(tableName)
      .update({
        ptr_sent: true,
        date_marked_sent: new Date().toISOString(),
        marked_by: userId,
      })
      .eq('id', itemId)
      .select();

    if (error) {
      console.error('Supabase error marking PTR as sent:', error);
      return NextResponse.json(
        { error: 'Failed to mark PTR as sent', details: error.message },
        { status: 500 }
      );
    }

    // Also update in the ptr_releases tracking table if it exists
    const { error: ptrError } = await supabase
      .from('ptr_releases')
      .update({
        ptr_sent: true,
        date_marked_sent: new Date().toISOString(),
        marked_by: userId,
      })
      .eq('item_id', itemId)
      .eq('table_name', tableName);

    // Don't fail if ptr_releases update fails (table might not have this item yet)
    if (ptrError) {
      console.warn('PTR releases table update warning:', ptrError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'PTR marked as sent successfully',
      data: data?.[0],
    });
  } catch (error) {
    console.error('Error in /api/ptr-sent:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ptr-sent
 * Unmarks a PTR item as sent (rollback)
 *
 * Request body:
 * - itemId: string - The raw item ID (without table prefix)
 * - tableName: string - The source table name
 *
 * Response:
 * - 200: Success
 * - 400: Bad request (missing parameters)
 * - 500: Server error
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, tableName } = body;

    // Validate required fields
    if (!itemId || !tableName) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, tableName' },
        { status: 400 }
      );
    }

    // Update the item in the source table
    const { data, error } = await supabase
      .from(tableName)
      .update({
        ptr_sent: false,
        date_marked_sent: null,
        marked_by: null,
      })
      .eq('id', itemId)
      .select();

    if (error) {
      console.error('Supabase error unmarking PTR:', error);
      return NextResponse.json(
        { error: 'Failed to unmark PTR as sent', details: error.message },
        { status: 500 }
      );
    }

    // Also update in the ptr_releases tracking table
    const { error: ptrError } = await supabase
      .from('ptr_releases')
      .update({
        ptr_sent: false,
        date_marked_sent: null,
        marked_by: null,
      })
      .eq('item_id', itemId)
      .eq('table_name', tableName);

    if (ptrError) {
      console.warn('PTR releases table update warning:', ptrError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'PTR unmarked as sent successfully',
      data: data?.[0],
    });
  } catch (error) {
    console.error('Error in /api/ptr-sent DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
