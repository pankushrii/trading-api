export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Auth, Sid'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Received modifyOrder request body:', req.body);
  console.log('Received modifyOrder request headers:', req.headers);

  try {
    const { auth, sid, orderData, orderNo } = req.body;

    if (!auth || !sid || !orderData || !orderNo) {
      console.error('Missing required fields in modifyOrder request');
      return res.status(400).json({
        error: 'Missing required fields (auth, sid, orderData, or orderNo)',
        received: { auth: !!auth, sid: !!sid, orderData: !!orderData, orderNo: !!orderNo },
      });
    }

    // Build the Kotak jData object for modify order
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
      tt: orderData.transactionType,
      no: orderNo  // Order number to modify
    };

    // Encode the body as URL-encoded form data
    const formBody = new URLSearchParams({
      jData: JSON.stringify(jData),
    }).toString();

    console.log('Sending modify order to Kotak:', {
      headers: {
        Auth: auth,
        Sid: sid,
        'neo-fin-key': 'neotradeapi',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    const kotakResponse = await fetch('https://mis.kotaksecurities.com/quick/order/vr/modify', {
      method: 'POST',
      headers: {
        Auth: auth,
        Sid: sid,
        'neo-fin-key': 'neotradeapi',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    const kotakData = await kotakResponse.json();

    console.log('Kotak modify order API response:', kotakData);

    if (!kotakResponse.ok) {
      return res.status(kotakResponse.status).json({
        error: 'Kotak API error',
        details: kotakData,
      });
    }

    return res.status(200).json({
      success: true,
      modifyResponse: kotakData,
    });
  } catch (error) {
    console.error('Error in modifyOrder:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
