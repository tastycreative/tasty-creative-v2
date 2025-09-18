import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Testing SSE connection directly',
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    url: request.url
  });
}

// Simple test of server-sent events
export async function POST(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send test messages
      const sendMessage = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      
      sendMessage({ type: 'test', message: 'Connection established' });
      
      let count = 0;
      const interval = setInterval(() => {
        count++;
        sendMessage({ 
          type: 'test', 
          message: `Test message ${count}`,
          timestamp: Date.now()
        });
        
        if (count >= 3) {
          clearInterval(interval);
          sendMessage({ type: 'test', message: 'Test complete' });
          controller.close();
        }
      }, 1000);
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
