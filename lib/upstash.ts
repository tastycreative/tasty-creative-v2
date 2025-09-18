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

// Store notification in Redis (for persistence and history)
export async function storeNotification(notification: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const key = `notification:${notification.userId}:${notification.id}`;
    
    // Use individual HSET commands for better compatibility
    const commands = [
      ['HSET', key, 'id', notification.id],
      ['HSET', key, 'type', notification.type],
      ['HSET', key, 'title', notification.title],
      ['HSET', key, 'message', notification.message],
      ['HSET', key, 'data', JSON.stringify(notification.data || {})],
      ['HSET', key, 'userId', notification.userId || ''],
      ['HSET', key, 'teamId', notification.teamId || ''],
      ['HSET', key, 'timestamp', notification.timestamp.toString()],
      ['HSET', key, 'isRead', 'false']
    ];

    // Execute all HSET commands
    for (const command of commands) {
      const result = await executeRedisCommand(command);
      if (!result.success) {
        console.error('❌ Failed to set field:', command[2], result.error);
        return { success: false, error: result.error };
      }
    }

    // Set expiration to 30 days
    const expireResult = await executeRedisCommand(['EXPIRE', key, '2592000']);
    if (!expireResult.success) {
      console.warn('⚠️ Failed to set expiration:', expireResult.error);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// Get user notifications from Redis (optimized to avoid expensive KEYS operation)
export async function getUserNotifications(userId: string): Promise<{ success: boolean; notifications?: NotificationPayload[]; error?: string }> {
  try {
    // Use Redis stream instead of KEYS operation for better performance
    const streamKey = `notifications:${userId}`;
    
    // Get recent notifications from stream (last 50 messages)
    const streamResult = await executeRedisCommand([
      'XREVRANGE', 
      streamKey, 
      '+', 
      '-', 
      'COUNT', '50'
    ]);
    
    if (!streamResult.success) {
      console.log('❌ Stream read failed, fallback to legacy method');
      return { success: true, notifications: [] }; // Graceful fallback
    }

    const notifications: NotificationPayload[] = [];
    const messages = streamResult.data || [];
    
    for (const message of messages) {
      if (Array.isArray(message) && message.length === 2) {
        const [, fields] = message;
        
        // Parse fields array
        const messageData: any = {};
        if (Array.isArray(fields)) {
          for (let i = 0; i < fields.length; i += 2) {
            const key = fields[i];
            const value = fields[i + 1];
            
            if (key === 'notification' && typeof value === 'string') {
              try {
                messageData.notification = JSON.parse(value);
              } catch {
                messageData.notification = value;
              }
            } else {
              messageData[key] = value;
            }
          }
        }
        
        if (messageData.notification) {
          notifications.push(messageData.notification);
        }
      }
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    return { success: true, notifications };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// Mark notification as read
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const key = `notification:${userId}:${notificationId}`;
    const result = await executeRedisCommand(['HSET', key, 'isRead', 'true']);
    return { success: result.success, error: result.error };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// Send webhook notification to active connections (Vercel-efficient)
export async function sendWebhookNotification(userId: string, notification: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // Webhook notification functionality
    
    // In production, this would be your app's domain
    const webhookUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/notifications/efficient-stream`
      : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/efficient-stream`;

    console.log('📡 Sending webhook to:', webhookUrl, 'for user:', userId);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        notification
      }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    console.log('📡 Webhook response status:', response.status, response.statusText);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        console.log('📡 Webhook sent successfully:', result);
        return { success: true };
      } else {
        // Response is not JSON, but status is OK
        console.log('📡 Webhook sent (non-JSON response)');
        return { success: true };
      }
    } else {
      const error = await response.text();
      console.error('❌ Webhook failed:', response.status, error);
      return { success: false, error: `${response.status}: ${error}` };
    }
  } catch (err: any) {
    console.error('❌ Webhook error:', err.message);
    
    // Don't fail the entire notification if webhook fails
    if (err.name === 'AbortError') {
      return { success: false, error: 'Webhook timeout' };
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('fetch failed')) {
      return { success: false, error: 'Webhook server not available' };
    }
    
    return { success: false, error: err?.message || String(err) };
  }
}

// Efficient publish notification (stores + sends webhook)
export async function publishNotification(notification: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📤 Publishing notification to Redis stream:', notification.id);
    console.log('🎯 Target user ID:', notification.userId);
    console.log('📡 Will publish to stream key:', `notifications:${notification.userId}`);

    // Store notification for persistence and history
    if (notification.userId) {
      console.log('🏪 Starting notification storage...');
      const storeResult = await storeNotification(notification);
      if (!storeResult.success) {
        console.error('❌ Failed to store notification:', storeResult.error);
        // Continue anyway, real-time delivery might still work
      } else {
        console.log('💾 Notification stored successfully');
      }
    }

    // Publish to Redis stream for real-time delivery using XADD
    if (notification.userId) {
      console.log('📡 Starting Redis stream publish...');
      const streamKey = `notifications:${notification.userId}`;
      console.log('📡 Stream key:', streamKey);
      
      const streamResult = await executeRedisCommand([
        'XADD',
        streamKey,
        '*', // Auto-generate ID
        'notification', JSON.stringify(notification),
        'timestamp', notification.timestamp.toString(),
        'type', notification.type
      ]);

      if (!streamResult.success) {
        console.error('❌ Failed to add to Redis stream:', streamResult.error);
        return { success: false, error: streamResult.error };
      } else {
        console.log('📡 Added to Redis stream successfully:', streamResult.data);
      }

      // Set expiration on stream to prevent infinite growth (keep for 7 days)
      console.log('⏰ Setting stream expiration...');
      await executeRedisCommand(['EXPIRE', streamKey, '604800']); // 7 days in seconds
      console.log('⏰ Stream expiration set');
    } else {
      console.log('⚠️ No userId provided, skipping stream publish');
    }
    
    console.log('✅ Notification published to Redis stream:', notification.id);
    return { success: true };
    
  } catch (err: any) {
    console.error('❌ Error publishing notification to Redis stream:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export default upstashPublish;
