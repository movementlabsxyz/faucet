import { Ratelimit } from "@upstash/ratelimit";
import { IncomingMessage } from "http";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { Redis } from '@upstash/redis'

const kv = new Redis({
  url: process.env.PROD_KV_KV_REST_API_URL!,
  token: process.env.PROD_KV_KV_REST_API_TOKEN!,
})


const ratelimit = new Ratelimit({
  redis: kv,
  // 3 requests from the same IP in 24 hours
  limiter: Ratelimit.slidingWindow(3000, "3600 s"),
  prefix: "faucet-drop",
});

type ExtendedIncomingMessage = IncomingMessage & {
  headers: {
    [key: string]: string | string[] | undefined;
    "x-forwarded-for"?: string;
  };
};

function getXForwardedFor(req: ExtendedIncomingMessage): string | undefined {
  return req.headers["x-forwarded-for"];
}

function ips(req: any) {
  return getXForwardedFor(req)?.split(/\s*,\s*/);
}

export async function verifyHcaptchaToken(token: string, forwardedIp: string | null): Promise<{
  success: boolean;
  score?: number;
  challenge_ts?: string;
  hostname?: string;
  credit?: boolean;
  "error-codes"?: string[];
  score_reason?: string[];
}> {
  const secretKey = process.env.HCAPTCHA_SECRET_KEY!;
  const body = new URLSearchParams({
    secret: secretKey,
    response: token
  })
  if (forwardedIp) {
    body.set('remoteip', forwardedIp)
  }

  const response = await fetch('https://api.hcaptcha.com/siteverify', {
    method: 'POST',
    body
  })

  const data = await response.json()
  if (!data.success) {
    console.error('hCaptcha verification failed:', data)
  }
  return data
}

export default async function handler(request: any, response: any) {
  // You could alternatively limit based on user ID or similar
  const { token, address, network, config } = request.body;

  if (!process.env.FAUCET_AUTH_TOKEN) {
    console.log(`auth key not set`);
    return request
      .status(500)
      .json({ error: "faucet auth token not set" });
  }
  const ip = ips(request)?.[0] ?? "127.0.0.1";
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);
  const {
    success: addressSuccess,
    pending: addressPending,
    limit: addressLimit,
    reset: addressReset,
    remaining: addressRemaining,
  } = await ratelimit.limit(address);

  if (!success) {
    console.log(`ip rate limit. pending: ${pending}, limit: ${limit}, reset: ${reset}, remaining: ${remaining}`);
    return response
      .status(429)
      .json({ success: false, error: "IP rate limited" });
  }

  if (!addressSuccess) {
    console.log(`address rate limit`);
    return response
      .status(429)
      .json({ success: false, error: "Address rate limited" });
  }


  const captcha = await verifyHcaptchaToken(token, ip);
  if (!captcha.success) {
    return response.status(400).json({
      success: captcha.success,
      error: "Invalid Hcaptcha verification token",
    });
  }

  if (captcha?.score! > 0.8) { return response.status(400).json({
    success: false,
    error: "Invalid captcha"
  })}
  
  let fund;

  try {
    console.log(address, network, config);
    fund = await movementRequest(address, network, config);
  } catch (error) {
    console.log(error);
    const timeoutPattern = /Transaction [0-9a-fA-F]+ timed out in pending state after 20 seconds/;
    const sequencePattern = /API error Error(SequenceNumberTooOld):/;
    if (timeoutPattern.test(error.message) || sequencePattern.test(error.message)) {
      ratelimit.resetUsedTokens(ip);
    }
    return response.status(500).json({
      success: false,
      error:
        "Sorry but we ran into an issue.  Please try again in a few minutes.",
    });
  }

  if (!fund.success) {
    console.log(`failed to fund account`);
    return response
      .status(400)
      .json({ success: false, error: "Failed to fund account" });
  }

  return response
    .status(200)
    .json({ success: true, hash: fund.hash, limit: limit });
}

async function movementRequest(address: string, network: string, config: any) {
  const HEADERS = {
    authorization: `Bearer ${process.env.FAUCET_AUTH_TOKEN}`,
  };

  const aptos = new Aptos(
    new AptosConfig({
      network: Network.TESTNET,
      fullnode: config[network].url,
      faucet: config[network].faucetUrl,
      faucetConfig: { HEADERS: HEADERS },
    }),
  );

  const fund = await aptos.fundAccount({
    accountAddress: address,
    amount: 1000000000,
    options: { timeoutSecs: 120 },
  });
  return fund;
}

async function mevmRequest(
  address: string,
  token: string,
  config: any,
): Promise<any> {
  const requestData = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_batch_faucet",
    params: [address],
  };
  const res = await fetch(config["mevm"].url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Token: token,
    },
    body: JSON.stringify(requestData),
  });
  const data = await res.json();
  if (res.status !== 200) {
    return { success: false, error: data.error };
  }
  if (data.error) {
    return { success: false, error: data.error.message };
  }
  return { success: true };
}
