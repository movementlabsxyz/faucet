import {Ratelimit} from "@upstash/ratelimit";
import {kv} from "@vercel/kv";
import {IncomingMessage} from "http";
import {Aptos, AptosConfig, Network} from "@aptos-labs/ts-sdk";

const ratelimit = new Ratelimit({
  redis: kv,
  // 3 requests from the same IP in 24 hours
  limiter: Ratelimit.slidingWindow(10, "86400 s"),
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

export default async function handler(request: any, response: any) {
  // You could alternatively limit based on user ID or similar
  const {token, address } = request.body;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const verificationUrl = `https://challenges.cloudflare.com/turnstile/v0/siteverify?secret=${secretKey}&response=${token}`;
  if (!secretKey || !process.env.FAUCET_AUTH_TOKEN) {
    console.log(`secret key not set`);
    return request.status(500).json({error: "reCAPTCHA secret key not set"});
  }
  const ip = ips(request)?.[0] ?? "127.0.0.1";
​
  const {success, pending, limit, reset, remaining} = await ratelimit.limit(
    ip,
  );
  const {success : addressSuccess, pending: addressPending, limit: addressLimit, reset: addressReset, remaining: addressRemaining} = await ratelimit.limit(
    address,
  );
  
  if (!success) {
    console.log(`ip rate limit`);
    return response.status(429).json({success: false, error: "IP rate limited"});
  }

  if (!addressSuccess) {
    console.log(`address rate limit`);
    return response.status(429).json({success: false, error: "Address rate limited"});
  }
  
  const result = await fetch(verificationUrl, {
    body: JSON.stringify({
      secret: secretKey,
      response: token,
      remoteip: ip
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  try {
    const data = await result.json();
    console.log(data);
    if (data.success == false) {
      return response
        .status(400)
        .json({success: false, error: "Invalid reCAPTCHA token"});
    }
    const HEADERS = {
      authorization: `Bearer ${process.env.FAUCET_AUTH_TOKEN}`,
    };
    const aptos = new Aptos(
      new AptosConfig({
        network: Network.TESTNET,
        fullnode: "https://testnet.porto.movementnetwork.xyz/v1",
        faucet: "https://faucet.testnet.porto.movementnetwork.xyz",
        faucetConfig: {HEADERS: HEADERS},
      }),
    );

    const fund = await aptos.fundAccount({
      accountAddress: address,
      amount: 1000000000,
    });
    if (!fund.success) {
      console.log(`failed to fund account`);
      return response
        .status(400)
        .json({success: false, error: "Failed to fund account"});
    }

    return response
      .status(200)
      .json({success: true, hash: fund.hash, limit: limit});
  } catch (error) {
    console.log(error);
    return response.status(500).json({success: false, error: "Sorry but we ran into an issue.  Please try again in a few minutes."});
  }
}
