import { NextRequest, NextResponse } from 'next/server'
import { 
  markAsRelease,
  getReleases 
} from '@/lib/supabase-dynamic'

export const dynamic = 'force-dynamic'

/**
 * Handle PTR/releases operations using Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, itemId, tableName, title, userId, markedBy } = body

    // TODO: Get actual user ID from session
    const currentUserId = userId || 'current-user'
    const currentMarkedBy = markedBy || currentUserId

    switch (action) {
      case 'add':
        if (!itemId || !tableName || !title) {
          return NextResponse.json({ 
            error: 'Missing required fields: itemId, tableName, title' 
          }, { status: 400 })
        }

        const addResult = await markAsRelease(itemId, tableName, title, currentMarkedBy)
        
        if (!addResult.success) {
          return NextResponse.json({ 
            error: 'Failed to mark as release/PTR',
            details: addResult.error 
          }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Marked as PTR/release successfully' 
        })

      case 'remove':
        // For remove, we could add a removeFromReleases function or mark as inactive
        // For now, let's return not implemented
        return NextResponse.json({ 
          error: 'Remove functionality not implemented yet' 
        }, { status: 501 })

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use "add" or "remove"' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Releases API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get all PTR/release items
 */
export async function GET() {
  try {
    const result = await getReleases()
    
    if (result.error) {
      return NextResponse.json({ 
        error: 'Failed to fetch releases/PTR items',
        details: result.error 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      releases: result.data,
      count: result.data.length
    })
  } catch (error) {
    console.error('Get releases error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}