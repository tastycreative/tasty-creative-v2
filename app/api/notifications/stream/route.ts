import { NextRequest } from 'next/server';
import { auth } from '@/auth';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Simple SSE proxy that connects to Upstash subscribe stream for a user's channel.
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (!UPSTASH_URL || !UPSTASH_TOKEN) {
      return new Response(JSON.stringify({ error: 'Upstash not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const url = new URL(req.url);
    const teamParam = url.searchParams.get('team');

    // Channels we'll subscribe to: user channel and optional team channel
    const channels = [`user:${session.user.id}`];
    if (teamParam) channels.push(`team:${teamParam}`);

    // Upstash supports a streaming subscribe endpoint at /subscribe/:channel
    // We'll open a streaming fetch and pipe events as SSE.

    const controller = new AbortController();

    // Build subscribe URL for multiple channels by joining with ','
    const subscribePath = new URL(UPSTASH_URL);
    // Ensure no trailing slash
    subscribePath.pathname = subscribePath.pathname.replace(/\/$/, '') + `/subscribe/${channels.join(',')}`;

    let upstream: Response;
    try {
      upstream = await fetch(subscribePath.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
        },
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      console.error('Upstream fetch failed:', fetchErr);
      return new Response(JSON.stringify({ error: 'Upstash subscribe fetch failed', message: fetchErr?.message || String(fetchErr) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => 'Unable to read body');
      return new Response(JSON.stringify({ error: 'Upstash subscribe failed', details: text, status: upstream.status }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    // Create a streaming response that re-emits lines as SSE `data:` messages
    const stream = new ReadableStream({
      async start(controllerStream) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();

        // Send initial comment to keep connection alive
        controllerStream.enqueue(utf8Encode(': connected\n\n'));

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // Upstash sends newline-separated JSON lines; reformat to SSE
            const lines = chunk.split(/\r?\n/).filter(Boolean);
            for (const line of lines) {
              // Each line is expected to be a JSON array [channel, message]
              try {
                const parsed = JSON.parse(line);
                const payload = JSON.stringify(parsed);
                controllerStream.enqueue(utf8Encode(`data: ${payload}\n\n`));
              } catch (e) {
                // If not JSON, forward raw line
                controllerStream.enqueue(utf8Encode(`data: ${line}\n\n`));
              }
            }
          }
        } catch (err) {
          // upstream aborted
        } finally {
          controllerStream.close();
        }
      },
      cancel() {
        controller.abort();
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('SSE stream error:', error);
    return new Response(JSON.stringify({ error: 'SSE stream error', message: error?.message || String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

function utf8Encode(s: string) {
  return new TextEncoder().encode(s);
}