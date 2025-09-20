// Simplified notification publisher - Upstash Redis removed, using only Ably

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

// Direct Ably publish notification (no Redis/Upstash)
export async function publishNotification(notification: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📤 Publishing notification via Ably:', notification.id);
    console.log('🎯 Target user ID:', notification.userId);

    // Publish to Ably for real-time delivery (no Redis storage needed)
    if (notification.userId) {
      console.log('📡 Starting Ably publish...');
      
      // Use dynamic import to avoid server-side issues
      const { publishNotificationToUser } = await import('./ably');
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
        const { publishNotificationToTeam } = await import('./ably');
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

// Legacy compatibility exports (no-op stubs)
export async function upstashPublish(channel: string, message: any): Promise<PublishResult> {
  console.log('⚠️ upstashPublish called but Upstash removed - using Ably instead');
  return { success: false, channel, error: 'Upstash removed - use publishNotification instead' };
}

export async function executeRedisCommand(command: string[]): Promise<{ success: boolean; data?: any; error?: string }> {
  console.log('⚠️ executeRedisCommand called but Upstash removed');
  return { success: false, error: 'Upstash removed - Redis commands no longer supported' };
}

export default upstashPublish;
