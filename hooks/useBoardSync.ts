'use client';

import { useEffect, useCallback, useRef } from 'react';
import Ably from 'ably';
import { useQueryClient } from '@tanstack/react-query';
import { boardQueryKeys } from './useBoardQueries';

interface BoardSyncOptions {
  teamId: string;
  enabled?: boolean;
}

export interface TaskUpdateEvent {
  type: 'TASK_UPDATED' | 'TASK_CREATED' | 'TASK_DELETED' | 'TASK_MOVED';
  taskId: string;
  teamId: string;
  data?: any;
  userId?: string;
  timestamp: number;
}

export function useBoardSync({ teamId, enabled = true }: BoardSyncOptions) {
  const queryClient = useQueryClient();
  const ablyClientRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  // Initialize Ably client
  useEffect(() => {
    if (!enabled || !teamId) return;

    // Create Ably client with token auth
    const ablyClient = new Ably.Realtime({
      authUrl: '/api/ably/auth',
      authMethod: 'POST',
    });

    ablyClientRef.current = ablyClient;

    // Handle connection state changes
    ablyClient.connection.on((stateChange) => {
      console.log(`[BoardSync] Ably connection state: ${stateChange.current}`);

      if (stateChange.current === 'connected') {
        console.log(`[BoardSync] Connected to Ably for team: ${teamId}`);
      } else if (stateChange.current === 'failed') {
        console.error('[BoardSync] Ably connection failed:', stateChange.reason);
      }
    });

    return () => {
      console.log('[BoardSync] Cleaning up Ably client');
      ablyClient.close();
      ablyClientRef.current = null;
    };
  }, [enabled, teamId]);

  // Subscribe to team channel
  useEffect(() => {
    if (!enabled || !teamId || !ablyClientRef.current) return;

    const channelName = `board:${teamId}`;
    const channel = ablyClientRef.current.channels.get(channelName);
    channelRef.current = channel;

    console.log(`[BoardSync] Subscribing to channel: ${channelName}`);

    // Handle task updates
    const handleTaskUpdate = (message: Ably.Message) => {
      const event = message.data as TaskUpdateEvent;

      console.log(`[BoardSync] Received event:`, {
        type: event.type,
        taskId: event.taskId,
        teamId: event.teamId,
      });

      // Invalidate tasks query to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: boardQueryKeys.tasks(teamId)
      });

      // Optional: You can also directly update the cache for optimistic updates
      // This would require more complex logic to handle the different event types
    };

    channel.subscribe('task-update', handleTaskUpdate);

    // Attach to channel
    channel.attach((err) => {
      if (err) {
        console.error('[BoardSync] Failed to attach to channel:', err);
      } else {
        console.log(`[BoardSync] Successfully attached to channel: ${channelName}`);
      }
    });

    return () => {
      console.log(`[BoardSync] Unsubscribing from channel: ${channelName}`);
      channel.unsubscribe('task-update', handleTaskUpdate);
      channel.detach();
      channelRef.current = null;
    };
  }, [enabled, teamId, queryClient]);

  // Function to publish task updates
  const publishTaskUpdate = useCallback(async (event: Omit<TaskUpdateEvent, 'timestamp' | 'teamId'>) => {
    if (!channelRef.current) {
      console.warn('[BoardSync] Cannot publish - channel not ready');
      return;
    }

    const fullEvent: TaskUpdateEvent = {
      ...event,
      teamId,
      timestamp: Date.now(),
    };

    try {
      await channelRef.current.publish('task-update', fullEvent);
      console.log('[BoardSync] Published task update:', fullEvent.type);
    } catch (error) {
      console.error('[BoardSync] Failed to publish task update:', error);
    }
  }, [teamId]);

  return {
    publishTaskUpdate,
    isConnected: ablyClientRef.current?.connection.state === 'connected',
  };
}
