import {Ratelimit} from "@upstash/ratelimit";
import {kv} from "@vercel/kv";
import {IncomingMessage} from "http";
import {Aptos, AptosConfig, Network} from "@aptos-labs/ts-sdk";

const ratelimit = new Ratelimit({
  redis: kv,
  // 3 requests from the same IP in 24 hours
  limiter: Ratelimit.slidingWindow(2, "60 s"),
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
  const {token, address, network, config} = request.body;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const verificationUrl = `https://challenges.cloudflare.com/turnstile/v0/siteverify?secret=${secretKey}&response=${token}`;
  if (!secretKey || !process.env.FAUCET_AUTH_TOKEN) {
    console.log(`secret key not set`);
    return request
      .status(500)
      .json({error: "faucet auth token or secret key not set"});
  }
  const ip = ips(request)?.[0] ?? "127.0.0.1";
  const {success, pending, limit, reset, remaining} = await ratelimit.limit(ip);
  const {
    success: addressSuccess,
    pending: addressPending,
    limit: addressLimit,
    reset: addressReset,
    remaining: addressRemaining,
  } = await ratelimit.limit(address);

  if (!success) {
    console.log(`ip rate limit`);
    return response
      .status(429)
      .json({success: false, error: "IP rate limited"});
  }

  if (!addressSuccess) {
    console.log(`address rate limit`);
    return response
      .status(429)
      .json({success: false, error: "Address rate limited"});
  }

  let fund;
  if (network == "mevm") {
    console.log("request funds from mevm");
    fund = await mevmRequest(address, token, config);
    // mevm must not verify turnstile token
  } else {
    const result = await fetch(verificationUrl, {
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    try {
      const data = await result.json();
      if (data.success == false) {
        return response.status(400).json({
          success: false,
          error: "Invalid Turnstile verification token",
        });
      }

      fund = await movementRequest(address, network, config);
    } catch (error) {
      console.log(error);
      return response.status(500).json({
        success: false,
        error:
          "Sorry but we ran into an issue.  Please try again in a few minutes.",
      });
    }
  }

  if (!fund.success) {
    console.log(`failed to fund account`);
    return response
      .status(400)
      .json({success: false, error: "Failed to fund account"});
  }

  return response
    .status(200)
    .json({success: true, hash: fund.hash, limit: limit});
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
      faucetConfig: {HEADERS: HEADERS},
    }),
  );

  const fund = await aptos.fundAccount({
    accountAddress: address,
    amount: 1000000000,
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
    return {success: false, error: data.error};
  }
  if (data.error) {
    return {success: false, error: data.error.message};
  }
  return {success: true};
}
