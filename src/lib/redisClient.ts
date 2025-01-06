import { Redis } from '@upstash/redis'

export const redis = new Redis({
    url: process.env.PROD_KV_KV_REST_API_URL!,
    token: process.env.PROD_KV_KV_REST_API_TOKEN!,
})
