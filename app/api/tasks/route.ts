import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { trackTaskChanges, createTaskActivity } from '@/lib/taskActivityHelper';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { parseUserDate } from '@/lib/dateUtils';

const prisma = new PrismaClient();

// Configure S3 client for task/comment attachments (primary bucket)
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

async function deleteFromS3(s3Key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    await s3Client.send(command);
  } catch (err) {
    console.error('Error deleting from S3:', err);
    // Don't throw here; upstream callers may choose to ignore failures
  }
}

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


    let jobAssignedTo = assignedTo;

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
        wallPostSubmission: {
          include: {
            photos: {
              orderBy: {
                position: 'asc',
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
        wallPostSubmission: {
          include: {
            photos: {
              orderBy: {
                position: 'asc',
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
    // Automatic transition: Flyer Completed -> QA
    if (status === 'CUSTOM_FLYER_COMPLETED_1761147678038') {
      updateData.status = 'CUSTOM_QA__1761147691672';
    }

    const effectiveStatus = updateData.status || status;

    // Automatic QA assignment when moving to QA column
    // Only if:
    // 1. Status is changing to 'QA' (using ID)
    // 2. No specific assignee is being set in this update
    // 3. Task is currently unassigned
    // 4. Task is in OTP-PTR team (verified via DB fetch)
    // 5. Task title has 'PTR'
    if (effectiveStatus === 'CUSTOM_QA__1761147691672') {
      const taskInDb = currentTask as any;
      const isUnassigned = !taskInDb.assignedTo && !assignedTo;
      
      if (isUnassigned && taskInDb.podTeamId) {
        try {
           const team = await prisma.podTeam.findUnique({
             where: { id: taskInDb.podTeamId },
             select: { name: true }
           });
           
           if (team?.name === 'OTP-PTR' && typeof taskInDb.title === 'string' && taskInDb.title.toUpperCase().includes('PTR')) {
              const qaEmails = ['maryjoeopon.tastymedia@gmail.com', 'condrei.pineda122@gmail.com'];
              // Assign one randomly
              updateData.assignedTo = qaEmails[Math.floor(Math.random() * qaEmails.length)];
           }
        } catch (err) {
           console.error('Error during auto-QA assignment in PUT:', err);
        }
      }
    }

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

    // Best-effort: delete S3 files for task attachments and its comments' attachments
    try {
      // Get task attachments
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { attachments: true },
      } as any);

      const taskAttachments: any[] = (existingTask?.attachments as any[]) || [];
      const taskKeys = taskAttachments
        .map((att) => (att && typeof att === 'object' ? (att as any).s3Key : null))
        .filter((k): k is string => !!k);

      // Get comment attachments under this task
      const commentRecords = await (prisma as any).taskComment.findMany({
        where: { taskId },
        select: { attachments: true },
      });
      const commentKeys: string[] = [];
      for (const rec of commentRecords) {
        const atts: any[] = (rec?.attachments as any[]) || [];
        for (const att of atts) {
          if (att?.s3Key) commentKeys.push(att.s3Key);
        }
      }

      const allKeys = [...taskKeys, ...commentKeys];
      if (allKeys.length > 0) {
        await Promise.allSettled(allKeys.map((k) => deleteFromS3(k)));
      }
    } catch (cleanupErr) {
      // Log and continue; do not block task deletion on cleanup failures
      console.error('Error during S3 cleanup for task deletion:', cleanupErr);
    }

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