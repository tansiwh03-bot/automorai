export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  const APP_ID = '1458889719428985';
  const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
  const REDIRECT_URI = 'https://automorai.com/dashboard';

  try {
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${APP_SECRET}&code=${code}`;

    const response = await fetch(tokenUrl);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    return res.status(200).json({ access_token: data.access_token });
  } catch (err) {
    return res.status(500).json({ error: 'Token exchange failed' });
  }
}
