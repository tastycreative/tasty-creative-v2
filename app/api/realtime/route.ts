import { NextRequest, NextResponse } from 'next/server'

// In-memory store for active SSE connections (per serverless instance)
// Note: This will only work within the same serverless function instance
const sseConnections = new Map<string, {
  controller: ReadableStreamDefaultController
  teamId: string
  lastActivity: Date
}>()

// Cleanup stale connections
setInterval(() => {
  const now = new Date()
  sseConnections.forEach((connection, id) => {
    if (now.getTime() - connection.lastActivity.getTime() > 300000) { // 5 minutes
      try {
        connection.controller.close()
      } catch (error) {
        console.log('Error closing stale connection:', error)
      }
      sseConnections.delete(id)
    }
  })
}, 60000) // Check every minute

// Real-time updates using Server-Sent Events (SSE)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')

  if (!teamId) {
    return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
  }

  const connectionId = crypto.randomUUID()

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      // Store this connection
      sseConnections.set(connectionId, {
        controller,
        teamId,
        lastActivity: new Date()
      })
      
      const sendMessage = (data: any) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
          
          // Update last activity
          const connection = sseConnections.get(connectionId)
          if (connection) {
            connection.lastActivity = new Date()
          }
        } catch (error) {
          console.error('Error sending SSE message:', error)
          sseConnections.delete(connectionId)
        }
      }

      // Send initial connection message
      sendMessage({
        type: 'CONNECTED',
        teamId: teamId,
        connectionId: connectionId,
        timestamp: new Date().toISOString()
      })

      // Send periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        const connection = sseConnections.get(connectionId)
        if (connection) {
          sendMessage({
            type: 'HEARTBEAT',
            timestamp: new Date().toISOString(),
            activeConnections: sseConnections.size
          })
        } else {
          clearInterval(heartbeatInterval)
        }
      }, 30000) // Every 30 seconds

      // Cleanup on disconnect
      const cleanup = () => {
        clearInterval(heartbeatInterval)
        sseConnections.delete(connectionId)
        try {
          controller.close()
        } catch (error) {
          console.log('Error during cleanup:', error)
        }
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup)
      
      // Store cleanup function for manual cleanup
      if (sseConnections.has(connectionId)) {
        (sseConnections.get(connectionId) as any).cleanup = cleanup
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  })
}

// Handle task updates via POST
export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    
    console.log('Received task update for broadcasting:', update)
    
    // Validate the update
    if (!update.teamId || !update.type || !update.taskId) {
      return NextResponse.json(
        { error: 'Invalid update format. Required: teamId, type, taskId' }, 
        { status: 400 }
      )
    }
    
    // Broadcast to all SSE connections for this team
    let broadcastCount = 0
    sseConnections.forEach((connection) => {
      if (connection.teamId === update.teamId) {
        try {
          const encoder = new TextEncoder()
          const message = `data: ${JSON.stringify({
            type: update.type,
            taskId: update.taskId,
            teamId: update.teamId,
            data: update.data,
            timestamp: new Date().toISOString()
          })}\n\n`
          
          connection.controller.enqueue(encoder.encode(message))
          connection.lastActivity = new Date()
          broadcastCount++
        } catch (error) {
          console.error('Error broadcasting to SSE connection:', error)
          // Remove broken connection
          sseConnections.delete(connection.teamId)
        }
      }
    })
    
    console.log(`Broadcasted update to ${broadcastCount} SSE connections`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Update broadcasted via SSE',
      broadcastCount,
      activeConnections: sseConnections.size,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error processing task update:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process update',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
