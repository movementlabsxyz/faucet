import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { IncomingMessage } from 'http';

const ratelimit = new Ratelimit({
  redis: kv,
  // 5 requests from the same IP in 10 seconds
  limiter: Ratelimit.slidingWindow(1, '30 s'),
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
  console.log('init verification')
  const { token } = request.body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  if (!secretKey) {
    return request.status(500).json({ error: 'reCAPTCHA secret key not set' });
  }
  console.log('secret key exists')
  const ip = ips(request) ?? '127.0.0.1';

  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    ip[0]
  );
  try {
    const verification = await fetch(verificationUrl, {
      method: 'POST',
    });
    const data = await verification.json();

    if (!data.success) {
      response.status(400).json({ error: 'Invalid reCAPTCHA token' });
    }
    console.log('verification successful', success)
    response.status(success ? 200 : 429).json({ success, pending, limit, reset, remaining });
  } catch (error) {
    response.status(500).json({ error: 'Server error' });
  }
}