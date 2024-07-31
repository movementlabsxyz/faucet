import { ipAddress } from '@vercel/functions';
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server';

const ratelimit = new Ratelimit({
  redis: kv,
  // 5 requests from the same IP in 10 seconds
  limiter: Ratelimit.slidingWindow(3, '30 s'),
})

// Define which routes you want to rate limit
export const config = {
  runtime: 'edge'
}

export default async function handler(request: Request) {
  // You could alternatively limit based on user ID or similar
  const ip = ipAddress(request) || '127.0.0.1'
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    ip
  )

  return success ? NextResponse.next() : Response.redirect(new URL('/blocked', request.url))
}