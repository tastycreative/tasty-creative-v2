// Ably real-time messaging configuration for notifications
import Ably from 'ably';

const ABLY_API_KEY = process.env.ABLY_API_KEY;

if (!ABLY_API_KEY) {
  console.warn('⚠️ Ably API key not configured - real-time notifications will not work');
}

// Server-side Ably client (REST-only to avoid WebSocket issues in serverless)
export const ablyServer = ABLY_API_KEY ? new Ably.Rest(ABLY_API_KEY) : null;

// Types for notifications
export type PublishResult = {
  success: boolean;
  channel: string;
  message?: any;
  error?: string;
};

export type NotificationPayload = {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  userId?: string;
  teamId?: string;
  timestamp: number;
};

// Client-side Ably configuration (uses token auth for security)
export const ablyClientConfig = {
  authUrl: '/api/notifications/ably-token', // We'll create this endpoint for token authentication
  authMethod: 'POST' as const,
};

// Notification channel naming conventions
export const getNotificationChannelName = (userId: string) => `user:${userId}:notifications`;
export const getTeamChannelName = (teamId: string) => `team:${teamId}:notifications`;

// Message types for typed messaging
export type AblyNotificationMessage = {
  type: 'notification';
  data: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: any;
  };
};

export type AblyConnectionMessage = {
  type: 'connected' | 'disconnected' | 'error';
  message?: string;
};

export type AblyMessage = AblyNotificationMessage | AblyConnectionMessage;

// Publish notification to specific user channel
export async function publishNotificationToUser(userId: string, notification: any): Promise<{ success: boolean; error?: string }> {
  if (!ablyServer) {
    return { success: false, error: 'Ably not configured' };
  }

  try {
    const channelName = getNotificationChannelName(userId);
    const channel = ablyServer.channels.get(channelName);
    
    console.log(`📡 Publishing notification to Ably channel: ${channelName}`);
    console.log(`📋 Notification:`, notification.title);

    await channel.publish('notification', {
      type: 'notification',
      data: notification
    });

    console.log(`✅ Notification published successfully to ${channelName}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error publishing to Ably:', error);
    return { success: false, error: error.message || String(error) };
  }
}

// Publish notification to team channel
export async function publishNotificationToTeam(teamId: string, notification: any): Promise<{ success: boolean; error?: string }> {
  if (!ablyServer) {
    return { success: false, error: 'Ably not configured' };
  }

  try {
    const channelName = getTeamChannelName(teamId);
    const channel = ablyServer.channels.get(channelName);
    
    console.log(`📡 Publishing team notification to Ably channel: ${channelName}`);

    await channel.publish('notification', {
      type: 'notification',
      data: notification
    });

    console.log(`✅ Team notification published successfully to ${channelName}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error publishing team notification to Ably:', error);
    return { success: false, error: error.message || String(error) };
  }
}

// Main notification publishing function (unified Ably implementation)
export async function publishNotification(notification: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📤 Publishing notification via Ably:', notification.id);
    console.log('🎯 Target user ID:', notification.userId);

    // Publish to Ably for real-time delivery
    if (notification.userId) {
      console.log('📡 Starting Ably publish...');
      
      const ablyResult = await publishNotificationToUser(notification.userId, notification);

      if (!ablyResult.success) {
        console.error('❌ Failed to publish to Ably:', ablyResult.error);
        return { success: false, error: ablyResult.error };
      } else {
        console.log('📡 Published to Ably successfully');
      }

      // Also publish to team channel if teamId exists
      if (notification.teamId) {
        console.log('👥 Publishing to team channel:', notification.teamId);
        const teamResult = await publishNotificationToTeam(notification.teamId, notification);
        
        if (!teamResult.success) {
          console.warn('⚠️ Failed to publish to team channel:', teamResult.error);
          // Don't fail entire operation for team publish failure
        }
      }
    } else {
      console.log('⚠️ No userId provided, skipping Ably publish');
    }
    
    console.log('✅ Notification published via Ably:', notification.id);
    return { success: true };
    
  } catch (err: any) {
    console.error('❌ Error publishing notification via Ably:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

// Connection status helper (REST API doesn't have persistent connections)
export function getAblyConnectionState(): string {
  if (!ablyServer) return 'not-configured';
  
  return 'connected'; // REST API is always "connected" if configured
}

// Graceful cleanup (not needed for REST API)
export function closeAblyConnection(): void {
  if (ablyServer) {
    console.log('🔌 Ably REST client cleaned up');
  }
}

export default ablyServer;
