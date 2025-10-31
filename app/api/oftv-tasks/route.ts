import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      teamId,
      status,
      model,
      title,
      folderLink,
      videoEditorUserId,
      videoEditorStatus,
      thumbnailEditorUserId,
      thumbnailEditorStatus,
      dueDate,
      specialInstructions,
    } = body;

    // Validate required fields
    if (!teamId || !status || !model || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create task title combining model and title
    const taskTitle = `${model} - ${title}`;

    // Determine assignedTo from user IDs (prefer video editor, then thumbnail editor)
    let assignedTo = null;
    if (videoEditorUserId) {
      const videoUser = await prisma.user.findUnique({
        where: { id: videoEditorUserId },
        select: { email: true }
      });
      assignedTo = videoUser?.email || null;
    } else if (thumbnailEditorUserId) {
      const thumbnailUser = await prisma.user.findUnique({
        where: { id: thumbnailEditorUserId },
        select: { email: true }
      });
      assignedTo = thumbnailUser?.email || null;
    }

    // Create both Task and OFTVTask in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the main task
      const task = await tx.task.create({
        data: {
          title: taskTitle,
          description: '', // OFTV tasks use structured data in oFTVTask table
          priority: 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate) : null,
          assignedTo,
          createdById: session.user.id,
          podTeamId: teamId,
          status,
          assignedToTeam: false,
        },
        include: {
          createdBy: true,
          podTeam: true,
        },
      });

      // Create the OFTV-specific task data
      const oftvTask = await tx.oFTVTask.create({
        data: {
          taskId: task.id,
          model: model,
          folderLink: folderLink || null,
          videoEditorUserId: videoEditorUserId,
          videoEditorStatus: videoEditorStatus || 'NOT_STARTED',
          thumbnailEditorUserId: thumbnailEditorUserId,
          thumbnailEditorStatus: thumbnailEditorStatus || 'NOT_STARTED',
          specialInstructions: specialInstructions || null,
        },
        include: {
          videoEditorUser: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            }
          },
          thumbnailEditorUser: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            }
          }
        }
      });

      return { task, oftvTask };
    });

    return NextResponse.json({
      success: true,
      task: result.task,
      oftvTask: result.oftvTask,
    });
  } catch (error) {
    console.error('Error creating OFTV task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create OFTV task' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, taskId, ...updates } = body;

    // Support both 'id' and 'taskId' for flexibility
    const oftvTaskId = id || taskId;

    if (!oftvTaskId) {
      return NextResponse.json(
        { success: false, error: 'OFTV Task ID is required' },
        { status: 400 }
      );
    }

    // Look up user IDs if videoEditor or thumbnailEditor emails are provided
    const dataToUpdate: any = { ...updates };

    if (updates.videoEditor) {
      const videoEditorUser = await prisma.user.findUnique({
        where: { email: updates.videoEditor },
        select: { id: true }
      });
      dataToUpdate.videoEditorUserId = videoEditorUser?.id || null;
      // Remove email field as it doesn't exist in schema
      delete dataToUpdate.videoEditor;
    }

    if (updates.thumbnailEditor) {
      const thumbnailEditorUser = await prisma.user.findUnique({
        where: { email: updates.thumbnailEditor },
        select: { id: true }
      });
      dataToUpdate.thumbnailEditorUserId = thumbnailEditorUser?.id || null;
      // Remove email field as it doesn't exist in schema
      delete dataToUpdate.thumbnailEditor;
    }

    // Update OFTVTask with user relations included
    const oftvTask = await prisma.oFTVTask.update({
      where: { id: oftvTaskId },
      data: dataToUpdate,
      include: {
        videoEditorUser: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          }
        },
        thumbnailEditorUser: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          }
        }
      }
    });

    console.log('✅ OFTV Task Updated:', {
      id: oftvTask.id,
      hasVideoEditorUser: !!oftvTask.videoEditorUser,
      hasThumbnailEditorUser: !!oftvTask.thumbnailEditorUser,
      videoEditorUser: oftvTask.videoEditorUser,
      thumbnailEditorUser: oftvTask.thumbnailEditorUser
    });

    return NextResponse.json({
      success: true,
      oftvTask,
    });
  } catch (error) {
    console.error('Error updating OFTV task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update OFTV task' },
      { status: 500 }
    );
  }
}
