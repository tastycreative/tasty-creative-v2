import { NextRequest, NextResponse } from 'next/server'
import { 
  addToFavorites,
  removeFromFavorites,
  getUserFavorites 
} from '@/lib/supabase-dynamic'

export const dynamic = 'force-dynamic'

/**
 * Handle favorites operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, itemId, tableName, title, userId } = body

    // TODO: Get actual user ID from session
    const currentUserId = userId || 'current-user'

    switch (action) {
      case 'add':
        if (!itemId || !tableName || !title) {
          return NextResponse.json({ 
            error: 'Missing required fields: itemId, tableName, title' 
          }, { status: 400 })
        }

        const addResult = await addToFavorites(currentUserId, itemId, tableName, title)
        
        if (!addResult.success) {
          return NextResponse.json({ 
            error: 'Failed to add to favorites',
            details: addResult.error 
          }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Added to favorites' 
        })

      case 'remove':
        if (!itemId || !tableName) {
          return NextResponse.json({ 
            error: 'Missing required fields: itemId, tableName' 
          }, { status: 400 })
        }

        const removeResult = await removeFromFavorites(currentUserId, itemId, tableName)
        
        if (!removeResult.success) {
          return NextResponse.json({ 
            error: 'Failed to remove from favorites',
            details: removeResult.error 
          }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Removed from favorites' 
        })

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use "add" or "remove"' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Favorites API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get user favorites
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || 'current-user' // TODO: Get from session

    const result = await getUserFavorites(userId)
    
    if (result.error) {
      return NextResponse.json({ 
        error: 'Failed to fetch favorites',
        details: result.error 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      favorites: result.data,
      count: result.data.length
    })
  } catch (error) {
    console.error('Get favorites error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}