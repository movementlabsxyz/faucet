import { ipAddress } from '@vercel/functions';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ratelimit = new Ratelimit({
  redis: kv,
  // 3 requests from the same IP in 30 seconds
  limiter: Ratelimit.slidingWindow(3, '30 s'),
});

export default async function handler(request: Request) {
  try {
    const ip = ipAddress(request) || '127.0.0.1';
    console.log(`IP Address: ${ip}`);
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);

    console.log({
      success,
      limit,
      reset,
      remaining,
    });

    return new Response(String(success ? 200 : 429));
  } catch (error) {
    console.error('Error in handler:', error);
    return new Response(String(500));
  }
}