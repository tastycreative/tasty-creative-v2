import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
  console.log(`📡 Test notification endpoint hit`);
    
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

    return NextResponse.json({
      success: true,
      message: 'Test endpoint hit',
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
