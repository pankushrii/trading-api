export default async function handler(req, res) {
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
    const { sid, auth } = req.body;

    if (!sid || !auth) {
      return res.status(400).json({ error: 'Missing sid or auth token' });
    }

    const response = await fetch('https://mis.kotaksecurities.com/login/1.0/tradeApiValidate', {
      method: 'POST',
      headers: {
        'Authorization': 'a3de4fd6-da0b-49bc-8f11-256b84b5ec0f',
        'neo-fin-key': 'neotradeapi',
        'sid': sid,
        'Auth': auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mpin: '190990'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
