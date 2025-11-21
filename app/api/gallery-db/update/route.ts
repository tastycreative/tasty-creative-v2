import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  GalleryMetadataKeys,
  GalleryMetadataMap,
  parseGalleryMetadata,
  serializeGalleryNotes,
  setGalleryMetadataValue,
  stripGalleryMetadata,
} from '@/lib/galleryMetadata'

const sanitizeRevenue = (value: unknown): number => {
  if (typeof value === 'number') return isNaN(value) ? 0 : value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

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
    const { id, captionText, notes, price, category, outcome, contentStyle, totalRevenue } = body

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
    if (price !== undefined) updateData.price = price.toString() // Store as string in DB
    if (outcome !== undefined) updateData.outcome = outcome
    if (contentStyle !== undefined) updateData.content_style = contentStyle

    const needsNotesUpdate = [
      notes !== undefined,
      totalRevenue !== undefined,
      daysSinceLastSent !== undefined,
      rotationStatus !== undefined,
      isReadyForRotation !== undefined,
      dateMarkedSent !== undefined,
    ].some(Boolean)

    let notesToSave: string | undefined
    let latestRevenueUpdatedAt: string | undefined
    let latestRotationUpdatedAt: string | undefined
    let existingNotesRecord: string | undefined
    let metadata: GalleryMetadataMap = {}

    const getExistingNotes = async () => {
      if (existingNotesRecord === undefined) {
        const existing = await prisma.galleryMasterList.findUnique({
          where: { id: parseInt(id, 10) },
          select: { notes: true }
        })
        existingNotesRecord = existing?.notes || ''
        metadata = parseGalleryMetadata(existingNotesRecord)
      }
      return existingNotesRecord || ''
    }

    if (needsNotesUpdate) {
      await getExistingNotes()
    }

    const getBaseNotes = () => {
      if (notes !== undefined) {
        return stripGalleryMetadata(notes || '')
      }
      return stripGalleryMetadata(existingNotesRecord || '')
    }

    if (totalRevenue !== undefined) {
      const safeRevenue = sanitizeRevenue(totalRevenue)
      const timestamp = new Date().toISOString()
      setGalleryMetadataValue(metadata, GalleryMetadataKeys.revenue, safeRevenue.toFixed(2))
      setGalleryMetadataValue(metadata, GalleryMetadataKeys.revenueUpdatedAt, timestamp)
      latestRevenueUpdatedAt = timestamp
    }

    let rotationTouched = false
    if (rotationStatus !== undefined) {
      setGalleryMetadataValue(metadata, GalleryMetadataKeys.rotationStatus, rotationStatus)
      rotationTouched = true
    }
    if (daysSinceLastSent !== undefined) {
      const numericValue =
        typeof daysSinceLastSent === 'number' ? daysSinceLastSent :
        typeof daysSinceLastSent === 'string' ? parseInt(daysSinceLastSent, 10) : daysSinceLastSent
      if (numericValue === undefined || numericValue === null || isNaN(Number(numericValue))) {
        setGalleryMetadataValue(metadata, GalleryMetadataKeys.rotationDaysSince, undefined)
      } else {
        setGalleryMetadataValue(metadata, GalleryMetadataKeys.rotationDaysSince, Math.max(0, Number(numericValue)))
      }
      rotationTouched = true
    }
    if (isReadyForRotation !== undefined) {
      setGalleryMetadataValue(
        metadata,
        GalleryMetadataKeys.rotationReady,
        typeof isReadyForRotation === 'boolean' ? (isReadyForRotation ? 'true' : 'false') : String(isReadyForRotation)
      )
      rotationTouched = true
    }
    if (dateMarkedSent !== undefined) {
      setGalleryMetadataValue(
        metadata,
        GalleryMetadataKeys.rotationDateSent,
        dateMarkedSent || undefined
      )
      rotationTouched = true
    }

    if (rotationTouched) {
      const timestamp = new Date().toISOString()
      setGalleryMetadataValue(metadata, GalleryMetadataKeys.rotationUpdatedAt, timestamp)
      latestRotationUpdatedAt = timestamp
    }

    if (needsNotesUpdate) {
      const baseNotes = getBaseNotes()
      notesToSave = serializeGalleryNotes(metadata, baseNotes)
      updateData.notes = notesToSave
    }

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

    const updatedMetadata = parseGalleryMetadata(updatedItem.notes || '')
    const sanitizedNotes = stripGalleryMetadata(updatedItem.notes || '')
    const normalizeDate = (value?: string) => {
      if (!value) return undefined
      const date = new Date(value)
      if (isNaN(date.getTime())) return undefined
      return date.toISOString()
    }
    const responseRevenueUpdatedAt =
      latestRevenueUpdatedAt ||
      normalizeDate(updatedMetadata[GalleryMetadataKeys.revenueUpdatedAt])
    const responseRotationUpdatedAt =
      latestRotationUpdatedAt ||
      normalizeDate(updatedMetadata[GalleryMetadataKeys.rotationUpdatedAt])
    const responseDaysSince = (() => {
      const value = updatedMetadata[GalleryMetadataKeys.rotationDaysSince]
      if (value === undefined) return undefined
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? undefined : parsed
    })()
    const responseReady = updatedMetadata[GalleryMetadataKeys.rotationReady]
    const responseDateMarked = normalizeDate(updatedMetadata[GalleryMetadataKeys.rotationDateSent])
    const responseRotationStatus = updatedMetadata[GalleryMetadataKeys.rotationStatus]

    return NextResponse.json({
      success: true,
      message: 'Gallery item updated successfully',
      item: {
        id: updatedItem.id,
        captionText: updatedItem.caption,
        notes: sanitizedNotes,
        price: parseFloat(updatedItem.price || '0'),
        outcome: updatedItem.outcome,
        contentStyle: updatedItem.content_style,
        revenueUpdatedAt: responseRevenueUpdatedAt || null,
        rotationStatus: (responseRotationStatus as 'Active' | 'Resting' | 'Ready' | undefined) || null,
        daysSinceLastSent: responseDaysSince ?? null,
        isReadyForRotation: responseReady !== undefined ? responseReady === 'true' : null,
        dateMarkedSent: responseDateMarked || null,
        rotationUpdatedAt: responseRotationUpdatedAt || null,
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
