import { prisma } from '@/lib/prisma';

// Helper function to get column label by status and teamId
async function getColumnLabel(status: string, teamId: string): Promise<string> {
  try {
    const column = await prisma.boardColumn.findFirst({
      where: {
        status,
        teamId,
        isActive: true,
      },
      select: {
        label: true,
      },
    });
    return column?.label || status;
  } catch (error) {
    console.error('Error fetching column label:', error);
    return status;
  }
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  dueDate?: string | null;
  attachments?: any[];
}

export interface TaskActivityData {
  taskId: string;
  userId: string;
  actionType: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
}

export async function createTaskActivity(data: TaskActivityData) {
  // Helper function to properly serialize values
  const serializeValue = (value: any): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value; // Don't JSON.stringify simple strings
    return JSON.stringify(value); // Only stringify complex objects
  };

  return prisma.taskActivityHistory.create({
    data: {
      taskId: data.taskId,
      userId: data.userId,
      actionType: data.actionType,
      fieldName: data.fieldName,
      oldValue: serializeValue(data.oldValue),
      newValue: serializeValue(data.newValue),
      description: data.description
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    }
  });
}

export async function generateActivityDescription(
  actionType: string,
  fieldName: string | null,
  oldValue: any,
  newValue: any,
  userName: string,
  teamId?: string
): Promise<string> {
  switch (actionType) {
    case 'CREATED':
      return `${userName} created this task`;
    
    case 'STATUS_CHANGED':
      if (teamId) {
        const oldLabel = await getColumnLabel(oldValue, teamId);
        const newLabel = await getColumnLabel(newValue, teamId);
        return `${userName} changed status from "${oldLabel}" to "${newLabel}"`;
      }
      return `${userName} changed status from "${oldValue}" to "${newValue}"`;
    
    case 'PRIORITY_CHANGED':
      return `${userName} changed priority from "${oldValue}" to "${newValue}"`;
    
    case 'ASSIGNED':
      if (oldValue) {
        return `${userName} reassigned from "${oldValue}" to "${newValue}"`;
      }
      return `${userName} assigned to "${newValue}"`;
    
    case 'UNASSIGNED':
      return `${userName} unassigned from "${oldValue}"`;
    
    case 'DUE_DATE_CHANGED':
      if (!oldValue && newValue) {
        return `${userName} set due date to ${new Date(newValue).toLocaleDateString()}`;
      } else if (oldValue && !newValue) {
        return `${userName} removed due date`;
      } else {
        return `${userName} changed due date from ${new Date(oldValue).toLocaleDateString()} to ${new Date(newValue).toLocaleDateString()}`;
      }
    
    case 'UPDATED':
      if (fieldName === 'title') {
        return `${userName} updated title`;
      } else if (fieldName === 'description') {
        return `${userName} updated description`;
      }
      return `${userName} updated ${fieldName}`;
    
    case 'ATTACHMENT_ADDED':
      return `${userName} added attachment`;
    
    case 'ATTACHMENT_REMOVED':
      return `${userName} removed attachment`;
    
    case 'COMMENT_ADDED':
      return `${userName} added a comment`;
    
    case 'DELETED':
      return `${userName} deleted this task`;
    
    default:
      return `${userName} made changes to this task`;
  }
}

export async function trackTaskChanges(
  taskId: string,
  userId: string,
  userName: string,
  oldTask: any,
  newTask: TaskUpdateData,
  teamId?: string
) {
  const activities: TaskActivityData[] = [];

  // Track status changes
  if (newTask.status && oldTask.status !== newTask.status) {
    const description = await generateActivityDescription('STATUS_CHANGED', 'status', oldTask.status, newTask.status, userName, teamId);
    activities.push({
      taskId,
      userId,
      actionType: 'STATUS_CHANGED',
      fieldName: 'status',
      oldValue: oldTask.status,
      newValue: newTask.status,
      description
    });
  }

  // Track priority changes
  if (newTask.priority && oldTask.priority !== newTask.priority) {
    const description = await generateActivityDescription('PRIORITY_CHANGED', 'priority', oldTask.priority, newTask.priority, userName, teamId);
    activities.push({
      taskId,
      userId,
      actionType: 'PRIORITY_CHANGED',
      fieldName: 'priority',
      oldValue: oldTask.priority,
      newValue: newTask.priority,
      description
    });
  }

  // Track assignment changes
  if (newTask.assignedTo !== undefined && oldTask.assignedTo !== newTask.assignedTo) {
    const actionType = newTask.assignedTo ? (oldTask.assignedTo ? 'ASSIGNED' : 'ASSIGNED') : 'UNASSIGNED';
    const description = await generateActivityDescription(actionType, 'assignedTo', oldTask.assignedTo, newTask.assignedTo, userName, teamId);
    activities.push({
      taskId,
      userId,
      actionType,
      fieldName: 'assignedTo',
      oldValue: oldTask.assignedTo,
      newValue: newTask.assignedTo,
      description
    });
  }

  // Track due date changes
  if (newTask.dueDate !== undefined && oldTask.dueDate !== newTask.dueDate) {
    const description = await generateActivityDescription('DUE_DATE_CHANGED', 'dueDate', oldTask.dueDate, newTask.dueDate, userName, teamId);
    activities.push({
      taskId,
      userId,
      actionType: 'DUE_DATE_CHANGED',
      fieldName: 'dueDate',
      oldValue: oldTask.dueDate,
      newValue: newTask.dueDate,
      description
    });
  }

  // Track title changes
  if (newTask.title && oldTask.title !== newTask.title) {
    const description = await generateActivityDescription('UPDATED', 'title', oldTask.title, newTask.title, userName, teamId);
    activities.push({
      taskId,
      userId,
      actionType: 'UPDATED',
      fieldName: 'title',
      oldValue: oldTask.title,
      newValue: newTask.title,
      description
    });
  }

  // Track description changes
  if (newTask.description !== undefined && oldTask.description !== newTask.description) {
    const description = await generateActivityDescription('UPDATED', 'description', oldTask.description, newTask.description, userName, teamId);
    activities.push({
      taskId,
      userId,
      actionType: 'UPDATED',
      fieldName: 'description',
      oldValue: oldTask.description,
      newValue: newTask.description,
      description
    });
  }

  // Create all activity entries
  const createdActivities = [];
  for (const activity of activities) {
    const created = await createTaskActivity(activity);
    createdActivities.push(created);
  }

  return createdActivities;
}