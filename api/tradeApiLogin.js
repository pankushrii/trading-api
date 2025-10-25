export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { totp } = req.body;

    if (!totp || totp.length !== 6) {
      return res.status(400).json({ error: 'Invalid TOTP code' });
    }

    const response = await fetch('https://mis.kotaksecurities.com/login/1.0/tradeApiLogin', {
      method: 'POST',
      headers: {
        'Authorization': 'a3de4fd6-da0b-49bc-8f11-256b84b5ec0f',
        'neo-fin-key': 'neotradeapi',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mobileNumber: '+917000560918',
        ucc: 'YIVKF',
        totp: totp
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
