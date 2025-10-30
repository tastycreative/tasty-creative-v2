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
      videoEditor,
      videoEditorStatus,
      thumbnailEditor,
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

    // Determine assignedTo (prefer video editor, then thumbnail editor)
    const assignedTo = videoEditor || thumbnailEditor || null;

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
          videoEditor: videoEditor || null,
          videoEditorStatus: videoEditorStatus || 'NOT_STARTED',
          thumbnailEditor: thumbnailEditor || null,
          thumbnailEditorStatus: thumbnailEditorStatus || 'NOT_STARTED',
          specialInstructions: specialInstructions || null,
        },
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

    // Update OFTVTask
    const oftvTask = await prisma.oFTVTask.update({
      where: { id: oftvTaskId },
      data: updates,
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
