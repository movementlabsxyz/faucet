import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const ratelimit = new Ratelimit({
  redis: kv,
  // 5 requests from the same IP in 10 seconds
  limiter: Ratelimit.slidingWindow(2, '10 s'),
});

function ips(req: Request) {
return req.headers.get("x-forwarded-for")?.split(/\s*,\s*/);
}

export default async function handler(request: Request) {
  // You could alternatively limit based on user ID or similar
  const ip = ips(request) ?? '127.0.0.1';
  
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    ip[0]
  );
  return  new Response(String(success ? 200 : 429));
}