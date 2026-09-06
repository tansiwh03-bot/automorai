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
    // Step 1: exchange code for user access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${APP_SECRET}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error.message });
    }

    const userAccessToken = tokenData.access_token;

    // Step 2: fetch the Pages this user manages, with each Page's own access token
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`
    );
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      return res.status(400).json({ error: pagesData.error.message });
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      return res.status(400).json({ error: 'No Facebook Pages found for this account' });
    }

    // For now, take the first Page (later: let user choose if they manage multiple)
    const page = pagesData.data[0];

    return res.status(200).json({
      access_token: page.access_token, // Page-specific token, not user token
      page_id: page.id,
      page_name: page.name,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Token exchange failed' });
  }
}
