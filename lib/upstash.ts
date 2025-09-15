// Lightweight Upstash Redis REST helper for publishing notification events.
// Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from environment.

type PublishResult = {
  success: boolean;
  channel: string;
  message?: any;
  error?: string;
};

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  // Upstash not configured; publish will be no-op in this environment
}

export async function upstashPublish(channel: string, message: any): Promise<PublishResult> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return { success: false, channel, error: 'Upstash not configured' };
  }

  try {
    const body = JSON.stringify({
      command: ['PUBLISH', channel, JSON.stringify(message)],
    });

    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, channel, error: `Upstash responded ${res.status}: ${text}` };
    }

    const data = await res.json();
    return { success: true, channel, message: data };
  } catch (err: any) {
    return { success: false, channel, error: err?.message || String(err) };
  }
}

export default upstashPublish;
