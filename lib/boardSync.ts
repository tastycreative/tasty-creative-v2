import Ably from 'ably';

const ABLY_API_KEY = process.env.ABLY_API_KEY;

let ablyRestClient: Ably.Rest | null = null;

function getAblyRestClient(): Ably.Rest | null {
  if (!ABLY_API_KEY) {
    console.warn('⚠️ Ably API key not configured - board sync will not work');
    return null;
  }

  if (!ablyRestClient) {
    ablyRestClient = new Ably.Rest(ABLY_API_KEY);
  }

  return ablyRestClient;
}

export interface TaskUpdateEvent {
  type: 'TASK_UPDATED' | 'TASK_CREATED' | 'TASK_DELETED' | 'TASK_MOVED';
  taskId: string;
  teamId: string;
  data?: any;
  userId?: string;
  timestamp: number;
}

/**
 * Publishes a task update event to the team's board channel via Ably
 */
export async function publishBoardUpdate(
  teamId: string,
  event: Omit<TaskUpdateEvent, 'timestamp' | 'teamId'>
): Promise<{ success: boolean; error?: string }> {
  const client = getAblyRestClient();

  if (!client) {
    return { success: false, error: 'Ably not configured' };
  }

  try {
    const channelName = `board:${teamId}`;
    const channel = client.channels.get(channelName);

    const fullEvent: TaskUpdateEvent = {
      ...event,
      teamId,
      timestamp: Date.now(),
    };

    console.log(`📡 Publishing board update to channel: ${channelName}`, {
      type: event.type,
      taskId: event.taskId,
    });

    await channel.publish('task-update', fullEvent);

    console.log(`✅ Board update published successfully to ${channelName}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error publishing board update to Ably:', error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Publishes a task creation event
 */
export async function publishTaskCreated(
  teamId: string,
  taskId: string,
  userId?: string,
  data?: any
): Promise<void> {
  await publishBoardUpdate(teamId, {
    type: 'TASK_CREATED',
    taskId,
    userId,
    data,
  });
}

/**
 * Publishes a task update event
 */
export async function publishTaskUpdated(
  teamId: string,
  taskId: string,
  userId?: string,
  data?: any
): Promise<void> {
  await publishBoardUpdate(teamId, {
    type: 'TASK_UPDATED',
    taskId,
    userId,
    data,
  });
}

/**
 * Publishes a task deletion event
 */
export async function publishTaskDeleted(
  teamId: string,
  taskId: string,
  userId?: string
): Promise<void> {
  await publishBoardUpdate(teamId, {
    type: 'TASK_DELETED',
    taskId,
    userId,
  });
}

/**
 * Publishes a task move event (status change)
 */
export async function publishTaskMoved(
  teamId: string,
  taskId: string,
  oldStatus: string,
  newStatus: string,
  userId?: string
): Promise<void> {
  await publishBoardUpdate(teamId, {
    type: 'TASK_MOVED',
    taskId,
    userId,
    data: {
      oldStatus,
      newStatus,
    },
  });
}
