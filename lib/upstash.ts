const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  // Allow local development without Upstash configured — functions will be no-ops
  console.warn('⚠️ UPSTASH not configured. PUB/SUB will be disabled.');
}

// Upstash helper stub — no-op when UPSTASH not desired.
export async function pushUserMessage() { return null; }
export async function popUserMessage() { return null; }
