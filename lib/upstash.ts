// Comprehensive Upstash Redis REST helper for real-time notifications (Vercel-optimized)
// Uses webhooks instead of polling to minimize function invocations

export type PublishResult = {
  success: boolean;
  channel: string;
  message?: any;
  error?: string;
};

export type RedisCommand = {
  command: string[];
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

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.warn('⚠️ Upstash not configured - notifications will not work');
}

// Generic Redis command executor
export async function executeRedisCommand(command: string[]): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return { success: false, error: 'Upstash not configured' };
  }

  try {
    // Simple command logging without request body details
    console.log('🔧 Redis command:', command[0], '→', command[1] || '...');

    const body = JSON.stringify(command);

    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      console.log('❌ Redis error:', text);
      return { success: false, error: `Upstash responded ${res.status}: ${text}` };
    }

    const data = await res.json();
    return { success: true, data: data.result };
  } catch (err: any) {
    console.log('❌ Redis command exception:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

// Publish notification to a channel
export async function upstashPublish(channel: string, message: any): Promise<PublishResult> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return { success: false, channel, error: 'Upstash not configured' };
  }

  try {
    const result = await executeRedisCommand(['PUBLISH', channel, JSON.stringify(message)]);
    if (result.success) {
      return { success: true, channel, message: result.data };
    } else {
      return { success: false, channel, error: result.error };
    }
  } catch (err: any) {
    return { success: false, channel, error: err?.message || String(err) };
  }
}

// Note: Redis storage removed - notifications now use database storage via lib/notifications.ts
// and real-time delivery via Ably in lib/ably.ts

// Efficient publish notification using Ably (pure Ably implementation)
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

export default upstashPublish;
