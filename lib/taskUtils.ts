import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a task URL using the prefix-taskNumber format if available, fallback to task ID
 */
export async function generateTaskUrl(taskId: string, teamId?: string): Promise<string> {
  try {
    // Fetch task with podTeam to get projectPrefix
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        podTeam: {
          select: {
            id: true,
            projectPrefix: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const teamParam = teamId || task.podTeamId || task.podTeam?.id;
    
    // Use prefix-taskNumber if available, otherwise fallback to task ID
    const taskIdentifier = (task.podTeam?.projectPrefix && task.taskNumber) 
      ? `${task.podTeam.projectPrefix}-${task.taskNumber}`
      : task.id;

    return `${baseUrl}/apps/pod/board?team=${teamParam}&task=${taskIdentifier}`;
  } catch (error) {
    console.error('Error generating task URL:', error);
    // Fallback to basic URL with task ID
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${baseUrl}/apps/pod/board?team=${teamId}&task=${taskId}`;
  }
}

/**
 * Get task identifier (prefix-taskNumber or ID)
 */
export async function getTaskIdentifier(taskId: string): Promise<string> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        podTeam: {
          select: {
            projectPrefix: true,
          },
        },
      },
    });

    if (!task) {
      return taskId;
    }

    return (task.podTeam?.projectPrefix && task.taskNumber) 
      ? `${task.podTeam.projectPrefix}-${task.taskNumber}`
      : task.id;
  } catch (error) {
    console.error('Error getting task identifier:', error);
    return taskId;
  }
}

/**
 * Get task with prefix information for notifications
 */
export async function getTaskForNotification(taskId: string) {
  try {
    return await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        podTeam: {
          select: {
            id: true,
            name: true,
            projectPrefix: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching task for notification:', error);
    return null;
  }
}
