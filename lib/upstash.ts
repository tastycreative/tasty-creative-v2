const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  // Allow local development without Upstash configured — functions will be no-ops
  console.warn('⚠️ UPSTASH not configured. PUB/SUB will be disabled.');
}

function upstashRequest(body: any) {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    return Promise.resolve({ error: 'upstash-not-configured' });
  }

  return fetch(UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
    body: JSON.stringify(body),
  }).then((res) => res.json());
}

// Publish a message by LPUSH to a per-user list and set an expiry
export async function pushUserMessage(userId: string, message: any) {
  try {
    if (!UPSTASH_REDIS_REST_URL) return null;

    const key = `notifications:user:${userId}`;
    const args = [key, JSON.stringify(message)];

    // LPUSH
    await upstashRequest({ cmd: ['lpush', ...args] });
    // Set short expiry to avoid long-term storage
    await upstashRequest({ cmd: ['expire', key, '86400'] }); // 1 day
    return true;
  } catch (error) {
    console.error('Upstash pushUserMessage error:', error);
    return false;
  }
}

// Pop a single message for a user (LPOP -> returns latest)
export async function popUserMessage(userId: string) {
  try {
    if (!UPSTASH_REDIS_REST_URL) return null;
    const key = `notifications:user:${userId}`;
    const result = await upstashRequest({ cmd: ['rpop', key] });
    // result will be the popped value or null
    if (!result) return null;
    // Upstash returns array for some cases; handle string
    if (typeof result === 'string') return JSON.parse(result);
    if (Array.isArray(result) && result[0]) return JSON.parse(result[0]);
    return null;
  } catch (error) {
    console.error('Upstash popUserMessage error:', error);
    return null;
  }
}
