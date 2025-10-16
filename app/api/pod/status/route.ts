import { NextRequest, NextResponse } from 'next/server';

// Global event emitter to communicate between API routes
class StatusEventEmitter {
  private static instance: StatusEventEmitter;
  private clients: Set<WritableStreamDefaultWriter<Uint8Array>> = new Set();

  static getInstance(): StatusEventEmitter {
    if (!StatusEventEmitter.instance) {
      StatusEventEmitter.instance = new StatusEventEmitter();
    }
    return StatusEventEmitter.instance;
  }

  addClient(writer: WritableStreamDefaultWriter<Uint8Array>) {
    this.clients.add(writer);
  }

  removeClient(writer: WritableStreamDefaultWriter<Uint8Array>) {
    this.clients.delete(writer);
  }

  broadcast(data: any) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    this.clients.forEach(async (writer) => {
      try {
        await writer.write(encoded);
      } catch (error) {
        console.warn('Failed to write to SSE client:', error);
        this.clients.delete(writer);
      }
    });
  }
}

export const statusEmitter = StatusEventEmitter.getInstance();

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      controller.enqueue(encoder.encode("data: {\"type\":\"connected\"}\n\n"));

      // Set up periodic keep-alive
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode("data: {\"type\":\"ping\"}\n\n"));
        } catch (error) {
          clearInterval(keepAliveInterval);
        }
      }, 30000); // Every 30 seconds

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed
        }
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}