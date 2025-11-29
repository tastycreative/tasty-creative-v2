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
        page: workflow.modelName || null,                    // Creator/model name (e.g., "BENTLEE PAID")
        type: "MM",                                          // Always "MM" for modular workflow
        scheduled_date: workflow.releaseDate || null,        // Release date (e.g., "9/18/2025")
        time_pst: workflow.releaseTime || null,              // Release time (e.g., "11:40:00 PM")
        message_type: workflow.contentStyle || null,         // Content style (NORMAL/GAME/POLL/BUNDLE/PPV)
        content_preview: workflow.gifUrl || null,            // GIF/preview URL
        paywall_content: workflow.contentCount || null,      // Content count (e.g., "1 Video, 3 Photos")
        content_style: null,                                 // Not mapped yet
        caption: workflow.caption || null,                   // Caption text
        caption_style: workflow.contentType || null,         // Video category (BG/BGG/GG/SOLO/etc)
        price: workflow.pricing || null,                     // Price as string
        outcome: null,                                        // Can be updated later
        notes: workflow.notes || null,                       // Additional notes
        schedule_tab: null,                                   // Auto-generate later
        data_source: "BOARD",                                 // Mark as coming from Board
        source_task_id: taskId,                               // Link to original task
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
