import { NextRequest, NextResponse } from 'next/server';

// Debug endpoint to check connection status
export async function GET(request: NextRequest) {
  try {
    // This will import the activeConnections from the other endpoint
    // Since we can't directly access it, we'll create a simple status endpoint
    
    const response = await fetch('http://localhost:3000/api/notifications/efficient-stream', {
      method: 'PATCH', // Use the stats endpoint we created
    });
    
    if (response.ok) {
      const stats = await response.json();
      return NextResponse.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        connections: stats
      });
    } else {
      return NextResponse.json({
        status: 'Error',
        error: 'Failed to get connection stats'
      }, { status: 500 });
    }
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'Error',
      error: error?.message || String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
