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

  console.log('Received loginAPI request body:', req.body);
  console.log('Received LoginAPI request headers:', req.headers);

  const apiConfigs = {
  '1': {
    authorization: 'a3de4fd6-da0b-49bc-8f11-256b84b5ec0f',
    neoFinKey: 'neotradeapi',
    mobileNumber: '+917000560918',
    ucc: 'YIVKF'
  },
  '2': {
    authorization: 'a3de4fd6-da0b-49bc-8f11-256b84b5ec0f',
    neoFinKey: 'neotradeapi',
    mobileNumber: '+917000560918',
    ucc: 'YIVKF'
  }
};
  const buttonType = req.headers['x-button-type'] || '1';
  const config = apiConfigs[buttonType];
  
  try {
    const { totp } = req.body;

    if (!totp || totp.length !== 6) {
      return res.status(400).json({ error: 'Invalid TOTP code' });
    }

    const response = await fetch('https://mis.kotaksecurities.com/login/1.0/tradeApiLogin', {
      method: 'POST',
      headers: {
  'Authorization': config.authorization,
  'neo-fin-key': config.neoFinKey,
  'Content-Type': 'application/json'
},
body: JSON.stringify({
  mobileNumber: config.mobileNumber,
  ucc: config.ucc,
  totp: totp
})
        });

    const data = await response.json();
 // Log the response for debugging
    console.log('tradeApiLogin response:', JSON.stringify(data));
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
