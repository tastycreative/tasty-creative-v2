import { NextRequest, NextResponse } from 'next/server'
import { 
  addToFavorites,
  removeFromFavorites,
  getUserFavorites 
} from '@/lib/supabase-dynamic'
import { prisma } from '@/lib/prisma'

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
          console.warn('Supabase favorites add failed, falling back to Prisma:', addResult.error)
          try {
            await prisma.galleryFavorite.upsert({
              where: {
                user_id_item_id: {
                  user_id: currentUserId,
                  item_id: itemId
                }
              },
              update: {},
              create: {
                user_id: currentUserId,
                item_id: itemId
              }
            })
          } catch (prismaError) {
            console.error('Prisma fallback add favorite failed:', prismaError)
            return NextResponse.json({ 
              error: 'Failed to add to favorites',
              details: prismaError instanceof Error ? prismaError.message : prismaError 
            }, { status: 500 })
          }
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
          console.warn('Supabase favorites remove failed, falling back to Prisma:', removeResult.error)
          try {
            await prisma.galleryFavorite.delete({
              where: {
                user_id_item_id: {
                  user_id: currentUserId,
                  item_id: itemId
                }
              }
            })
          } catch (prismaError) {
            console.error('Prisma fallback remove favorite failed:', prismaError)
            return NextResponse.json({ 
              error: 'Failed to remove from favorites',
              details: prismaError instanceof Error ? prismaError.message : prismaError 
            }, { status: 500 })
          }
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
      console.warn('Supabase get favorites failed, falling back to Prisma:', result.error)
      const prismaFavorites = await prisma.galleryFavorite.findMany({
        where: { user_id: userId }
      })

      return NextResponse.json({
        success: true,
        favorites: prismaFavorites,
        count: prismaFavorites.length
      })
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
