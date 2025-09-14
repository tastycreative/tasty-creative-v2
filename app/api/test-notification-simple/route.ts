import { NextRequest, NextResponse } from 'next/server';
import { broadcastToUser, getConnectionCount, getConnectedUsers } from '@/lib/sse-broadcast';

export async function GET(req: NextRequest) {
  try {
    const connectionCount = getConnectionCount();
    const connectedUsers = getConnectedUsers();
    
    console.log(`📡 SSE Debug Info:`);
    console.log(`- Active connections: ${connectionCount}`);
    console.log(`- Connected users: ${JSON.stringify(connectedUsers)}`);
    
    // Try to broadcast to all connected users
    const testData = {
      id: 'test-notification-' + Date.now(),
      type: 'SYSTEM_NOTIFICATION',
      title: 'Test Notification',
      message: 'This is a test notification sent at ' + new Date().toLocaleTimeString(),
      isRead: false,
      createdAt: new Date().toISOString(),
      data: { test: true }
    };

    const results: any[] = [];
    
    for (const userId of connectedUsers) {
      console.log(`📡 Broadcasting test notification to user: ${userId}`);
      const success = await broadcastToUser(userId, 'NEW_NOTIFICATION', testData);
      results.push({ userId, success });
    }

    return NextResponse.json({
      success: true,
      message: 'Test notifications sent',
      connectionCount,
      connectedUsers,
      broadcastResults: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
