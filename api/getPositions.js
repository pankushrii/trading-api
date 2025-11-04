export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Auth, Sid');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { auth, sid } = req.headers;

  console.log('[LOG] getPositions called');

  try {
    if (!auth || !sid) {
      return res.status(400).json({ error: 'Missing auth or sid headers' });
    }

    const response = await fetch('https://mis.kotaksecurities.com/quick/user/positions', {
      method: 'GET',
      headers: {
        'Auth': auth,
        'Sid': sid,
        'neo-fin-key': 'neotradeapi'
      }
    });

    const data = await response.json();
    console.log('[LOG] Positions response:', data);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Kotak API error', details: data });
    }

    return res.status(200).json({
      success: true,
      positions: data
    });
  } catch (error) {
    console.error('[ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}
