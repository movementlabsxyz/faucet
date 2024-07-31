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

function getHeader(request: Request, headerName: string): string | null {
  // Try to get header in a case-insensitive way
  const headerValue = request.headers[headerName.toLowerCase() as any] || request.headers[headerName.toUpperCase() as any];
  return headerValue || null;
}

export default async function handler(req: Request, res: Response): Promise<Response> {
  try {
    const ip = getHeader(req, 'x-forwarded-for') || getHeader(req, 'cf-connecting-ip') || await ipAddress(req);

    console.log(`IP Address: ${ip}`);
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip??'');

    console.log({
      success,
      limit,
      reset,
      remaining,
    });

    return new Response(JSON.stringify({ success, pending, limit, reset, remaining }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in handler:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
