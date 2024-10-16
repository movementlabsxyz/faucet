import {Ratelimit} from "@upstash/ratelimit";
import {kv} from "@vercel/kv";
import {IncomingMessage} from "http";
import {RecaptchaEnterpriseServiceClient} from "@google-cloud/recaptcha-enterprise";
import {Aptos, AptosConfig, Network} from "@aptos-labs/ts-sdk";

const ratelimit = new Ratelimit({
  redis: kv,
  // 3 requests from the same IP in 24 hours
  limiter: Ratelimit.slidingWindow(2, "86400 s"),
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

// TODO: Use createAssessment instead.
async function createAssessment(
  // TODO: Replace the token and reCAPTCHA action variables before running the sample.
  projectID: string,
  recaptchaKey: string,
  recaptchaAction: string,
  token: string,
) {
  // Create the reCAPTCHA client.
  // TODO: Cache the client generation code (recommended) or call client.close() before exiting the method.
  const client = new RecaptchaEnterpriseServiceClient();
  const projectPath = client.projectPath(projectID);

  // Build the assessment request.
  const request = {
    assessment: {
      event: {
        token: token,
        siteKey: recaptchaKey,
      },
    },
    parent: projectPath,
  };
  console.log("creating assessment");
  const [response] = await client.createAssessment(request);
  console.log("response", response);
  if (!response.tokenProperties) return null;
  // Check if the token is valid.
  if (!response.tokenProperties.valid) {
    console.log(
      `The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`,
    );
    return null;
  }

  // Check if the expected action was executed.
  // The `action` property is set by user client in the grecaptcha.enterprise.execute() method.
  if (response.tokenProperties.action === recaptchaAction) {
    // Get the risk score and the reason(s).
    // For more information on interpreting the assessment, see:
    // https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment
    if (!response.riskAnalysis) return null;
    console.log(`The reCAPTCHA score is: ${response.riskAnalysis.score}`);
    response.riskAnalysis.reasons?.forEach((reason) => {
      console.log(reason);
    });

    return response.riskAnalysis.score;
  } else {
    console.log(
      "The action attribute in your reCAPTCHA tag does not match the action you are expecting to score",
    );
    return null;
  }
}

export default async function handler(request: any, response: any) {
  // You could alternatively limit based on user ID or similar
  const {token, address, network} = request.body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  if (!secretKey || !process.env.FAUCET_AUTH_TOKEN) {
    console.log(`secret key not set`);
    return request.status(500).json({error: "reCAPTCHA secret key not set"});
  }
  const ip = ips(request) ?? "127.0.0.1";

  // const score = await createAssessment("movement-faucet-1722352143785", "6LdVjR0qAAAAAFSjzYqyRFsnUDn-iRrzQmv0nnp3", "", token);
  // console.log('score', score)
  // if (score === (null || undefined)) {
  //   response.status(400).json({ error: 'Invalid reCAPTCHA token' });
  // } else if (score != null && score < 0.5) {
  //   response.status(400).json({ error: 'reCAPTCHA score too low' });
  // } else {
  //   response.status(success ? 200 : 429).json({ success, pending, limit, reset, remaining });
  // }
  const {success, pending, limit, reset, remaining} = await ratelimit.limit(
    ip[0],
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
  
  const verification = await fetch(verificationUrl, {method: "POST"});
  try {
    const data = await verification.json();
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
