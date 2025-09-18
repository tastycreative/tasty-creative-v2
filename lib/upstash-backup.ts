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
    const body = JSON.stringify({ command });

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
      return { success: false, error: `Upstash responded ${res.status}: ${text}` };
    }

    const data = await res.json();
    return { success: true, data: data.result };
  } catch (err: any) {
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
    
    // Use HMSET instead of HSET for better compatibility
    const result = await executeRedisCommand([
      'HMSET', 
      key,
      'id', notification.id,
      'type', notification.type,
      'title', notification.title,
      'message', notification.message,
      'data', JSON.stringify(notification.data || {}),
      'userId', notification.userId || '',
      'teamId', notification.teamId || '',
      'timestamp', notification.timestamp.toString(),
      'isRead', 'false'
    ]);

    if (result.success) {
      // Set expiration to 30 days
      await executeRedisCommand(['EXPIRE', key, '2592000']);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// Get user notifications from Redis
export async function getUserNotifications(userId: string): Promise<{ success: boolean; notifications?: NotificationPayload[]; error?: string }> {
  try {
    // Get all notification keys for user
    const keysResult = await executeRedisCommand(['KEYS', `notification:${userId}:*`]);
    
    if (!keysResult.success) {
      return { success: false, error: keysResult.error };
    }

    const keys = keysResult.data || [];
    if (keys.length === 0) {
      return { success: true, notifications: [] };
    }

    // Get all notifications in parallel
    const notifications: NotificationPayload[] = [];
    
    for (const key of keys) {
      const notifResult = await executeRedisCommand(['HGETALL', key]);
      if (notifResult.success && notifResult.data && Object.keys(notifResult.data).length > 0) {
        const data = notifResult.data;
        notifications.push({
          id: data.id,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.parse(data.data) : {},
          userId: data.userId,
          teamId: data.teamId,
          timestamp: parseInt(data.timestamp),
        });
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
    // In production, this would be your app's domain
    const webhookUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/notifications/efficient-stream`
      : 'http://localhost:3000/api/notifications/efficient-stream';

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        notification
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('📡 Webhook sent successfully:', result);
      return { success: true };
    } else {
      const error = await response.text();
      console.error('❌ Webhook failed:', error);
      return { success: false, error };
    }
  } catch (err: any) {
    console.error('❌ Webhook error:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

// Efficient publish notification (stores + sends webhook)
export async function publishNotification(notification: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📤 Publishing notification efficiently:', notification.id);

    // Store notification for persistence and history
    if (notification.userId) {
      const storeResult = await storeNotification(notification);
      if (!storeResult.success) {
        console.error('❌ Failed to store notification:', storeResult.error);
        // Continue anyway, real-time delivery is more important
      }
    }

    // Send webhook to active connections (much more efficient than queues)
    if (notification.userId) {
      const webhookResult = await sendWebhookNotification(notification.userId, notification);
      if (!webhookResult.success) {
        console.error('❌ Failed to send webhook notification:', webhookResult.error);
      }
    }

    // Legacy pub/sub for backward compatibility (optional)
    const userChannel = `notifications:${notification.userId}`;
    const publishResult = await upstashPublish(userChannel, notification);
    
    if (!publishResult.success) {
      console.warn('⚠️ Legacy pub/sub failed (non-critical):', publishResult.error);
    }

    console.log('✅ Notification published efficiently:', notification.id);
    return { success: true };
    
  } catch (err: any) {
    console.error('❌ Error publishing notification:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export default upstashPublish;

// Generic Redis command executor
export async function executeRedisCommand(command: string[]): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return { success: false, error: 'Upstash not configured' };
  }

  try {
    const body = JSON.stringify({ command });
    
    console.log('🔧 Executing Redis command:', command[0], command.length > 1 ? `with ${command.length - 1} args` : '');

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
      console.error('❌ Redis command failed:', command[0], 'Status:', res.status, 'Response:', text);
      return { success: false, error: `Upstash responded ${res.status}: ${text}` };
    }

    const data = await res.json();
    console.log('✅ Redis command successful:', command[0]);
    return { success: true, data: data.result };
  } catch (err: any) {
    console.error('❌ Redis command error:', command[0], err);
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
    
    // Use multiple HSET commands to avoid parsing issues
    const fields = {
      'id': notification.id,
      'type': notification.type,
      'title': notification.title,
      'message': notification.message,
      'data': JSON.stringify(notification.data || {}),
      'userId': notification.userId || '',
      'teamId': notification.teamId || '',
      'timestamp': notification.timestamp.toString(),
      'isRead': 'false'
    };

    // Build HSET command properly
    const hsetCommand = ['HSET', key];
    Object.entries(fields).forEach(([field, value]) => {
      hsetCommand.push(field, value);
    });

    const result = await executeRedisCommand(hsetCommand);

    if (result.success) {
      // Set expiration to 30 days
      await executeRedisCommand(['EXPIRE', key, '2592000']);
      console.log('✅ Notification stored in Redis:', notification.id);
      return { success: true };
    } else {
      console.error('❌ Failed to store notification in Redis:', result.error);
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    console.error('❌ Error storing notification:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

// Get user notifications from Redis
export async function getUserNotifications(userId: string): Promise<{ success: boolean; notifications?: NotificationPayload[]; error?: string }> {
  try {
    // Get all notification keys for user
    const keysResult = await executeRedisCommand(['KEYS', `notification:${userId}:*`]);
    
    if (!keysResult.success) {
      return { success: false, error: keysResult.error };
    }

    const keys = keysResult.data || [];
    if (keys.length === 0) {
      return { success: true, notifications: [] };
    }

    // Get all notifications in parallel
    const notifications: NotificationPayload[] = [];
    
    for (const key of keys) {
      const notifResult = await executeRedisCommand(['HGETALL', key]);
      if (notifResult.success && notifResult.data) {
        const data = notifResult.data;
        notifications.push({
          id: data.id,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.parse(data.data) : {},
          userId: data.userId,
          teamId: data.teamId,
          timestamp: parseInt(data.timestamp),
        });
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
    // In production, this would be your app's domain
    const webhookUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/notifications/efficient-stream`
      : 'http://localhost:3000/api/notifications/efficient-stream';

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        notification
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('� Webhook sent successfully:', result);
      return { success: true };
    } else {
      const error = await response.text();
      console.error('❌ Webhook failed:', error);
      return { success: false, error };
    }
  } catch (err: any) {
    console.error('❌ Webhook error:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

// Efficient publish notification (stores + sends webhook)
export async function publishNotification(notification: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📤 Publishing notification efficiently:', notification.id);

    // Store notification for persistence and history
    if (notification.userId) {
      const storeResult = await storeNotification(notification);
      if (!storeResult.success) {
        console.error('❌ Failed to store notification:', storeResult.error);
        // Continue anyway, real-time delivery is more important
      }
    }

    // Send webhook to active connections (much more efficient than queues)
    if (notification.userId) {
      const webhookResult = await sendWebhookNotification(notification.userId, notification);
      if (!webhookResult.success) {
        console.error('❌ Failed to send webhook notification:', webhookResult.error);
      }
    }

    // Legacy pub/sub for backward compatibility (optional)
    const userChannel = `notifications:${notification.userId}`;
    const publishResult = await upstashPublish(userChannel, notification);
    
    if (!publishResult.success) {
      console.warn('⚠️ Legacy pub/sub failed (non-critical):', publishResult.error);
    }

    console.log('✅ Notification published efficiently:', notification.id);
    return { success: true };
    
  } catch (err: any) {
    console.error('❌ Error publishing notification:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

// Publish and store notification in one call
export async function publishNotification(notification: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📨 Publishing notification:', notification.id, 'to user:', notification.userId);

    // Ensure all required fields are present and properly typed
    const cleanNotification: NotificationPayload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      userId: notification.userId || '',
      teamId: notification.teamId || '',
      timestamp: notification.timestamp,
      data: notification.data || {}
    };

    // Store the notification for persistence (make this optional to avoid blocking)
    try {
      const storeResult = await storeNotification(cleanNotification);
      if (!storeResult.success) {
        console.warn('⚠️ Failed to store notification (non-blocking):', storeResult.error);
      }
    } catch (storeError) {
      console.warn('⚠️ Non-blocking store error:', storeError);
    }

    // Queue notification for real-time delivery to specific user (this is critical)
    if (cleanNotification.userId) {
      const queueResult = await queueNotificationForUser(cleanNotification.userId, cleanNotification);
      if (!queueResult.success) {
        console.error('❌ Failed to queue notification for user:', queueResult.error);
        // Don't return error here - let's still try the legacy publish
      }
    }

    // Also publish to legacy channel system (for backward compatibility)
    try {
      const userChannel = `notifications:${cleanNotification.userId}`;
      const publishResult = await upstashPublish(userChannel, cleanNotification);
      
      if (!publishResult.success) {
        console.warn('⚠️ Legacy publish failed:', publishResult.error);
      }
    } catch (publishError) {
      console.warn('⚠️ Legacy publish error:', publishError);
    }

    // Also publish to team channel if teamId is provided
    if (cleanNotification.teamId) {
      try {
        const teamChannel = `notifications:team:${cleanNotification.teamId}`;
        await upstashPublish(teamChannel, cleanNotification);
      } catch (teamError) {
        console.warn('⚠️ Team publish error:', teamError);
      }
    }

    console.log('✅ Notification published and queued successfully:', cleanNotification.id);
    return { success: true };
  } catch (err: any) {
    console.error('❌ Error publishing notification:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export default upstashPublish;
