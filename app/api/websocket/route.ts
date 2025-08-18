import { NextRequest } from 'next/server'

export const runtime = 'edge'

// WebSocket upgrade handler for Vercel Edge Runtime
export async function GET(request: NextRequest) {
  const upgradeHeader = request.headers.get('upgrade')
  
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 })
  }

  // Create WebSocket pair
  const { 0: client, 1: server } = new WebSocketPair()

  // Handle WebSocket connection
  handleWebSocket(server)

  return new Response(null, {
    status: 101,
    webSocket: client,
  })
}

interface TaskUpdate {
  type: 'TASK_UPDATED' | 'TASK_CREATED' | 'TASK_DELETED'
  taskId: string
  teamId: string
  data?: any
}

interface WebSocketClient {
  socket: WebSocket
  teamSubscriptions: Set<string>
}

// Store active connections (this will be per-edge instance)
const connections = new Map<string, WebSocketClient>()

function handleWebSocket(webSocket: WebSocket) {
  const clientId = crypto.randomUUID()
  
  connections.set(clientId, {
    socket: webSocket,
    teamSubscriptions: new Set()
  })

  webSocket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data)
      handleMessage(clientId, data)
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  })

  webSocket.addEventListener('close', () => {
    connections.delete(clientId)
    console.log(`WebSocket client ${clientId} disconnected`)
  })

  webSocket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event)
    connections.delete(clientId)
  })

  console.log(`WebSocket client ${clientId} connected`)
}

function handleMessage(clientId: string, data: any) {
  const client = connections.get(clientId)
  if (!client) return

  switch (data.type) {
    case 'SUBSCRIBE':
      if (data.teamId) {
        client.teamSubscriptions.add(data.teamId)
        console.log(`Client ${clientId} subscribed to team: ${data.teamId}`)
        
        // Send confirmation
        client.socket.send(JSON.stringify({
          type: 'SUBSCRIBED',
          teamId: data.teamId
        }))
      }
      break

    case 'UNSUBSCRIBE':
      if (data.teamId) {
        client.teamSubscriptions.delete(data.teamId)
        console.log(`Client ${clientId} unsubscribed from team: ${data.teamId}`)
      }
      break

    case 'TASK_UPDATED':
    case 'TASK_CREATED':
    case 'TASK_DELETED':
      broadcastToTeam(data.teamId, data, clientId)
      break
  }
}

function broadcastToTeam(teamId: string, message: TaskUpdate, excludeClientId?: string) {
  const broadcast = {
    type: message.type,
    taskId: message.taskId,
    teamId: teamId,
    data: message.data
  }

  connections.forEach((client, clientId) => {
    if (
      clientId !== excludeClientId &&
      client.socket.readyState === WebSocket.OPEN &&
      client.teamSubscriptions.has(teamId)
    ) {
      try {
        client.socket.send(JSON.stringify(broadcast))
      } catch (error) {
        console.error('Error sending WebSocket message:', error)
        connections.delete(clientId)
      }
    }
  })
}
