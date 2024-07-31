
export default async function handler(req, res) {
    const { address, token } = req.body;
    
    // Validate reCAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    
    try {
        const response = await fetch(verificationUrl, {
            method: 'POST',
        });
        const data = await response.json();
        
        if (!data.success) {
            return res.status(400).json({ error: 'Invalid reCAPTCHA token' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}