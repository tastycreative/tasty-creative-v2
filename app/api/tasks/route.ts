import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { trackTaskChanges, createTaskActivity } from '@/lib/taskActivityHelper';
import { parseUserDate } from '@/lib/dateUtils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { title, description, priority, assignedTo, dueDate, teamId, teamName, status, attachments } = await request.json();

    if (!title || !teamId) {
      return NextResponse.json(
        { error: 'Title and teamId are required' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || 'MEDIUM',
        status: status || 'NOT_STARTED',
        assignedTo: assignedTo || null,
        dueDate: dueDate ? parseUserDate(dueDate)?.toJSDate() : null,
        attachments: attachments || null,
        podTeamId: teamId, // Use podTeamId instead of teamId
        createdById: session.user.id,
        // taskNumber will be auto-incremented by the database
      } as any,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        podTeam: {
          select: {
            id: true,
            name: true,
            projectPrefix: true,
          },
        },
        oftvTask: {
          include: {
            task: false, // Avoid circular reference
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
        },
      },
    });

    // Create activity history for task creation
    await createTaskActivity({
      taskId: task.id,
      userId: session.user.id,
      actionType: 'CREATED',
      description: `${session.user.name || session.user.email} created this task`
    });

    // Fetch assigned user information
    let assignedUser = null;
    if (task.assignedTo) {
      assignedUser = await prisma.user.findUnique({
        where: { email: task.assignedTo },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });
    }

    const taskWithAssignedUser = {
      ...task,
      assignedUser,
    };

    return NextResponse.json({
      success: true,
      task: taskWithAssignedUser,
    });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        podTeamId: teamId,
      } as any,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        podTeam: {
          select: {
            id: true,
            name: true,
            projectPrefix: true,
          },
        },
        ModularWorkflow: {
          select: {
            id: true,
            submissionType: true,
            contentStyle: true,
            selectedComponents: true,
            componentData: true,
            modelName: true,
            priority: true,
            driveLink: true,
            status: true,
            createdAt: true,
            releaseDate: true,
            releaseTime: true,
            contentType: true,
            contentLength: true,
            contentCount: true,
            externalCreatorTags: true,
            internalModelTags: true,
            referenceAttachments: true,
            caption: true,
            gifUrl: true,
            notes: true,
            pricing: true,
            basePriceDescription: true,
            isFinal: true,
          },
        },
        oftvTask: {
          include: {
            task: false, // Avoid circular reference
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Batch fetch assigned users to avoid N+1 query problem
    // Collect unique emails from all tasks
    const uniqueEmails = [...new Set(
      tasks.map(t => t.assignedTo).filter((email): email is string => Boolean(email))
    )];

    // Single batch query for all users
    const users = uniqueEmails.length > 0
      ? await prisma.user.findMany({
          where: { email: { in: uniqueEmails } },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        })
      : [];

    // Create email-to-user map for O(1) lookup
    const userMap = new Map(users.map(u => [u.email, u]));

    // Map users to tasks (OFTV editor user data already included via relations in the query above)
    const tasksWithAssignedUsers = tasks.map(task => ({
      ...task,
      assignedUser: task.assignedTo ? (userMap.get(task.assignedTo) || null) : null
    }));

    return NextResponse.json({
      success: true,
      tasks: tasksWithAssignedUsers,
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, status, assignedTo, priority, title, description, dueDate, attachments } = await request.json();

    console.log('PUT /api/tasks - Request data:', { id, status, assignedTo, priority, title, description, dueDate, attachments });

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Fetch the current task data before updating
    const currentTask = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assignedTo: true,
        dueDate: true,
        podTeamId: true,
      } as any,
    });

    if (!currentTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedBy: session.user.email // Always set updatedBy to current user's email
    };
    if (status !== undefined) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (priority !== undefined) updateData.priority = priority;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? parseUserDate(dueDate)?.toJSDate() : null;
    if (attachments !== undefined) updateData.attachments = attachments;

    console.log('PUT /api/tasks - Update data being sent to Prisma:', updateData);

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        oftvTask: true,
      },
    });

    // Track changes and create activity history
    await trackTaskChanges(
      id,
      session.user.id,
      session.user.name || session.user.email || 'Unknown User',
      currentTask,
      { status, assignedTo, priority, title, description, dueDate, attachments },
      (currentTask as any).podTeamId
    );

    // Fetch assigned user information if assignedTo was updated
    let assignedUser = null;
    if (updatedTask.assignedTo) {
      assignedUser = await prisma.user.findUnique({
        where: { email: updatedTask.assignedTo },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });
    }

    const taskWithAssignedUser = {
      ...updatedTask,
      assignedUser,
    };

    return NextResponse.json({
      success: true,
      task: taskWithAssignedUser,
    });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Create deletion activity before deleting the task
    await createTaskActivity({
      taskId,
      userId: session.user.id,
      actionType: 'DELETED',
      description: `${session.user.name || session.user.email} deleted this task`
    });

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}