import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { recaptchaResponse } = await req.json();

  if (!recaptchaResponse) {
    return NextResponse.json({ success: false, message: 'No CAPTCHA token provided' }, { status: 400 });
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  const verificationResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${secretKey}&response=${recaptchaResponse}`,
  });

  const verificationResult = await verificationResponse.json();

  if (verificationResult.success) {
    // CAPTCHA verified successfully, proceed with your form processing
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ success: false, message: 'CAPTCHA verification failed' }, { status: 400 });
  }
}