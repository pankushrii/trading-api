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

  // Log incoming request data for debugging
  console.log('Received placeOrder request body:', req.body);
  console.log('Received placeOrder request headers:', req.headers);

  try {
    const { auth, sid, orderData } = req.body;

    if (!auth || !sid || !orderData) {
      console.error('Missing required fields in placeOrder request');
      return res.status(400).json({
        error: 'Missing required fields (auth, sid, or orderData)',
        received: { auth: !!auth, sid: !!sid, orderData: !!orderData },
      });
    }

    // Build the Kotak jData object according to API spec
    const jData = {
      am: 'NO', // aftermarket — NO
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
    };

    // Encode the body as URL-encoded form data
    const formBody = new URLSearchParams({
      jData: JSON.stringify(jData),
    }).toString();

  
    console.log('Sending place order to Kotak:', {
      headers: {
        Auth: auth,
        Sid: sid,
        'neo-fin-key': 'neotradeapi',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    console.log('Sending place order to Kotak:', jData);
    console.log('Sending place order to Kotak:', JSON.stringify(jData));
    
    const kotakResponse = await fetch('https://mis.kotaksecurities.com/quick/order/rule/ms/place', {
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

    console.log('Kotak API response:', kotakData);

    if (!kotakResponse.ok) {
      return res.status(kotakResponse.status).json({
        error: 'Kotak API error',
        details: kotakData,
      });
    }

    return res.status(200).json({
      success: true,
      orderResponse: kotakData,
    });
  } catch (error) {
    console.error('Error in placeOrder:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
