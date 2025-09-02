import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { title, description, priority, assignedTo, dueDate, teamId, teamName, status } = await request.json();

    if (!title || !teamId || !teamName) {
      return NextResponse.json(
        { error: 'Title, teamId, and teamName are required' },
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
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId,
        teamName,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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
        teamId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch assigned user information for each task
    const tasksWithAssignedUsers = await Promise.all(
      tasks.map(async (task) => {
        let assignedUser = null;
        
        if (task.assignedTo) {
          // Try to find user by email
          assignedUser = await prisma.user.findUnique({
            where: { email: task.assignedTo },
            select: {
              id: true,
              name: true,
              email: true,
            },
          });
        }
        
        return {
          ...task,
          assignedUser,
        };
      })
    );

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

    const { id, status, assignedTo, priority, title, description, dueDate } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
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
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Fetch assigned user information if assignedTo was updated
    let assignedUser = null;
    if (updatedTask.assignedTo) {
      assignedUser = await prisma.user.findUnique({
        where: { email: updatedTask.assignedTo },
        select: {
          id: true,
          name: true,
          email: true,
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