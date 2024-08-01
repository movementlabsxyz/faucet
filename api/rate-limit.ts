import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { IncomingMessage } from 'http';

const ratelimit = new Ratelimit({
  redis: kv,
  // 5 requests from the same IP in 10 seconds
  limiter: Ratelimit.slidingWindow(2, '20 s'),
});

type ExtendedIncomingMessage = IncomingMessage & {
  headers: {
    [key: string]: string | string[] | undefined;
    'x-forwarded-for'?: string;
  };
};

function getXForwardedFor(req: ExtendedIncomingMessage): string | undefined {
  return req.headers['x-forwarded-for'];
}

function ips(req: any) {
return getXForwardedFor(req)?.split(/\s*,\s*/);
}

export default async function handler(request: any, response: any) {
  // You could alternatively limit based on user ID or similar
  const ip = ips(request) ?? '127.0.0.1';
  console.log("IP:", ip);
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    ip[0]
  );
  response.status(success ? 200 : 429).json({ success, pending, limit, reset, remaining });
}