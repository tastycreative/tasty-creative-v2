import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Add content from ModularWorkflow task to GalleryMasterList (Caption Bank)
 * Called when user clicks "Mark as Final" button
 */
export async function POST(request: NextRequest) {
  try {
    const { workflowId, taskId } = await request.json()

    if (!workflowId || !taskId) {
      return NextResponse.json(
        { error: 'workflowId and taskId are required' },
        { status: 400 }
      )
    }

    // Fetch ModularWorkflow with task data
    const workflow = await prisma.modularWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check for duplicates - prevent adding same workflow twice
    const existingEntry = await prisma.galleryMasterList.findFirst({
      where: {
        caption: workflow.caption || '',
        page: workflow.modelName || '',
        content_style: workflow.contentStyle || '',
      }
    })

    if (existingEntry) {
      return NextResponse.json(
        {
          error: 'Content already exists in gallery',
          galleryItemId: existingEntry.id
        },
        { status: 409 }
      )
    }

    // Map ModularWorkflow data to GalleryMasterList format
    const galleryEntry = await prisma.galleryMasterList.create({
      data: {
        page: workflow.modelName || null,                    // Creator/model name
        content_style: workflow.contentStyle || null,        // NORMAL/GAME/POLL
        price: workflow.pricing || null,                     // Price as string
        content_preview: workflow.gifUrl || null,            // GIF/preview URL
        caption: workflow.caption || null,                   // Caption text
        notes: workflow.notes || null,                       // Additional notes
        type: workflow.contentType || null,                  // Content type (BG/Solo/etc)
        scheduled_date: workflow.releaseDate || null,        // Release date
        time_pst: workflow.releaseTime || null,              // Release time
        paywall_content: workflow.contentDescription || null,
        message_type: workflow.submissionType || null,       // OTP/PTR
        outcome: null,                                        // Can be updated later
        schedule_tab: null,
        caption_style: null,
      }
    })

    return NextResponse.json({
      success: true,
      galleryItemId: galleryEntry.id,
      message: 'Content added to gallery successfully'
    })

  } catch (error) {
    console.error('Error adding content to gallery:', error)
    return NextResponse.json(
      {
        error: 'Failed to add content to gallery',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
