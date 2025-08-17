import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  teamSubscriptions?: Set<string>;
}

class TaskWebSocketManager {
  private static instance: TaskWebSocketManager;
  private wss: WebSocketServer | null = null;
  private clients: Set<ExtendedWebSocket> = new Set();

  private constructor() {}

  static getInstance(): TaskWebSocketManager {
    if (!TaskWebSocketManager.instance) {
      TaskWebSocketManager.instance = new TaskWebSocketManager();
    }
    return TaskWebSocketManager.instance;
  }

  initialize(server: any) {
    if (this.wss) return;

    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: ExtendedWebSocket) => {
      console.log('New WebSocket client connected');
      
      ws.isAlive = true;
      ws.teamSubscriptions = new Set();
      this.clients.add(ws);

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    // Ping clients every 30 seconds to keep connections alive
    setInterval(() => {
      this.clients.forEach((ws) => {
        if (!ws.isAlive) {
          ws.terminate();
          this.clients.delete(ws);
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private handleMessage(ws: ExtendedWebSocket, data: any) {
    switch (data.type) {
      case 'SUBSCRIBE':
        if (data.teamId && ws.teamSubscriptions) {
          ws.teamSubscriptions.add(data.teamId);
          console.log(`Client subscribed to team: ${data.teamId}`);
        }
        break;

      case 'UNSUBSCRIBE':
        if (data.teamId && ws.teamSubscriptions) {
          ws.teamSubscriptions.delete(data.teamId);
          console.log(`Client unsubscribed from team: ${data.teamId}`);
        }
        break;

      case 'TASK_UPDATED':
      case 'TASK_CREATED':
      case 'TASK_DELETED':
        this.broadcastToTeam(data.teamId, data, ws);
        break;
    }
  }

  broadcastToTeam(teamId: string, message: any, excludeWs?: ExtendedWebSocket) {
    this.clients.forEach((ws) => {
      if (
        ws !== excludeWs &&
        ws.readyState === WebSocket.OPEN &&
        ws.teamSubscriptions?.has(teamId)
      ) {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          this.clients.delete(ws);
        }
      }
    });
  }

  broadcastTaskUpdate(teamId: string, update: any) {
    this.broadcastToTeam(teamId, {
      type: update.type,
      taskId: update.taskId,
      teamId: teamId,
      data: update.data
    });
  }
}

export default TaskWebSocketManager;
