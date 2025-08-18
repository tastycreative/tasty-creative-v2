import { NextRequest, NextResponse } from 'next/server'

// Simple HTTP endpoint that indicates WebSocket is not available
// This will trigger the SSE fallback in the client
export async function GET(request: NextRequest) {
  const upgradeHeader = request.headers.get('upgrade')
  
  if (upgradeHeader === 'websocket') {
    // Return error to trigger SSE fallback
    return new NextResponse(JSON.stringify({
      error: 'WebSocket not supported on Vercel Edge Runtime',
      fallback: 'sse',
      redirect: '/api/realtime'
    }), {
      status: 501,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  // Return status for non-WebSocket requests
  return NextResponse.json({
    status: 'WebSocket endpoint - use with upgrade header',
    method: 'GET',
    availableFallbacks: ['sse', 'polling']
  })
}

// Handle POST requests for testing
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Log the attempt for debugging
    console.log('WebSocket endpoint received POST:', data)
    
    return NextResponse.json({
      success: true,
      message: 'WebSocket endpoint received data',
      note: 'This is a fallback - real WebSocket not available on Vercel',
      data: data
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process WebSocket request'
    }, { status: 400 })
  }
}
