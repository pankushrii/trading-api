
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  
    // DEBUG: Log what we received
    console.log('Request body place Order:', req.body);
    console.log('Request headers place order:', Object.keys(req.headers));


  try {
    const { auth, sid, orderData } = req.body;

    if (!auth || !sid || !orderData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Build the jData object
    const jData = {
      am: 'NO',
      dq: '0',
      es: orderData.exchangeSegment,
      mp: '0',
      pc: orderData.productCode,
      pf: 'N',
      pr: orderData.price.toString(),
      pt: orderData.priceType,
      qt: orderData.quantity.toString(),
      rt: orderData.validity,
      tp: '0',
      ts: orderData.tradingSymbol,
      tt: orderData.transactionType
    };

    // Create URL-encoded body
    const formBody = 'jData=' + encodeURIComponent(JSON.stringify(jData));

    // Make request to Kotak NEO API
    const response = await fetch('https://mis.kotaksecurities.com/quick/order/rule/ms/place', {
      method: 'POST',
      headers: {
        'Auth': auth,
        'Sid': sid,
        'neo-fin-key': 'neotradeapi',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Order placement error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
