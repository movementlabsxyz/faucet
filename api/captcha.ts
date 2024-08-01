
export default async function handler(req: any, res: any) {
    const { token } = req.body;
    console.log('init verification')
    // Validate reCAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
        return res.status(500).json({ error: 'reCAPTCHA secret key not set' });
    }
    console.log('secret key exists')
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    try {
        const response = await fetch(verificationUrl, {
            method: 'POST',
        });
        const data = await response.json();
        console.log('data', data)
        
        if (!data.success) {
            return res.status(400).json({ error: 'Invalid reCAPTCHA token' });
        }
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}