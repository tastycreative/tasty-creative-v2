import { NextRequest, NextResponse } from 'next/server'

// Real-time updates using Server-Sent Events (SSE)
// This works well with Vercel's serverless functions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')

  if (!teamId) {
    return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder()
      
      const sendMessage = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Send initial connection
      sendMessage({
        type: 'CONNECTED',
        teamId: teamId,
        timestamp: new Date().toISOString()
      })

      // Set up polling for updates (this could be replaced with Redis pub/sub)
      const pollInterval = setInterval(async () => {
        try {
          // In a real implementation, you'd check Redis or database for updates
          // For now, we'll send a heartbeat
          sendMessage({
            type: 'HEARTBEAT',
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Error in SSE polling:', error)
        }
      }, 30000) // Poll every 30 seconds

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

// Handle task updates via POST
export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    
    // Here you would:
    // 1. Validate the update
    // 2. Store it in your database
    // 3. Publish to Redis/other pub-sub system
    // 4. Notify connected clients
    
    console.log('Received task update:', update)
    
    // For now, just acknowledge receipt
    return NextResponse.json({ 
      success: true, 
      message: 'Update received',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error processing task update:', error)
    return NextResponse.json(
      { error: 'Failed to process update' }, 
      { status: 500 }
    )
  }
}
