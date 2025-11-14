import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

/**
 * PATCH endpoint to update gallery item fields
 * Supports updating: caption, notes, price, content_style, outcome
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to edit gallery items' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, captionText, notes, price, category, outcome, contentStyle } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    // Build update object with only provided fields
    const updateData: any = {}

    if (captionText !== undefined) updateData.caption = captionText
    if (notes !== undefined) updateData.notes = notes
    if (price !== undefined) updateData.price = price.toString() // Store as string in DB
    if (outcome !== undefined) updateData.outcome = outcome
    if (contentStyle !== undefined) updateData.content_style = contentStyle

    // If no fields to update, return early
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Update the gallery item in database
    const updatedItem = await prisma.galleryMasterList.update({
      where: {
        id: parseInt(id, 10)
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Gallery item updated successfully',
      item: {
        id: updatedItem.id,
        captionText: updatedItem.caption,
        notes: updatedItem.notes,
        price: parseFloat(updatedItem.price || '0'),
        outcome: updatedItem.outcome,
        contentStyle: updatedItem.content_style,
      }
    })

  } catch (error) {
    console.error('Gallery update error:', error)

    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: 'Gallery item not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to update gallery item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
