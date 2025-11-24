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

  console.log('Received exitPosition request body:', req.body);

  try {
    const { auth, sid, position } = req.body;

    if (!auth || !sid || !position) {
      console.error('Missing required fields in exitPosition request');
      return res.status(400).json({
        error: 'Missing required fields (auth, sid, or position)',
        received: { auth: !!auth, sid: !!sid, position: !!position }
      });
    }

    const { 
      tradingSymbol, 
      quantity, 
      exchangeSegment, 
      productCode,
      priceType = 'MKT',
      price = '0'
    } = position;

    if (!tradingSymbol || !quantity) {
      return res.status(400).json({
        error: 'Missing tradingSymbol or quantity in position',
        received: position
      });
    }

    // Determine transaction type (opposite of current position)
    const transactionType = quantity > 0 ? 'S' : 'B';
    const absQuantity = Math.abs(quantity);

    console.log(`[LOG] Exiting position: ${tradingSymbol}`);
    console.log(`[LOG] Quantity: ${quantity} (${absQuantity} ${transactionType})`);
    console.log(`[LOG] Price Type: ${priceType}, Price: ${price}`);
    console.log(`[LOG] Exchange Segment: ${exchangeSegment}`);
    console.log(`[LOG] Product Code: ${productCode}`);

    // Build order data
    const orderData = {
      tradingSymbol: tradingSymbol,
      transactionType: transactionType,
      quantity: absQuantity,
      price: priceType === 'MKT' ? '0' : price,
      priceType: priceType,
      productCode: productCode || 'NRML',
      validity: 'DAY',
      exchangeSegment: exchangeSegment || 'nsefo'
    };

    // Build the Kotak jData object
    const jData = {
      am: 'NO',
      dq: '0',
      es: orderData.exchangeSegment,
      mp: '0',
      pc: orderData.productCode,
      pf: 'N',
      pr: orderData.price,
      pt: orderData.priceType,
      qt: orderData.quantity.toString(),
      rt: orderData.validity,
      tp: '0',
      ts: orderData.tradingSymbol,
      tt: orderData.transactionType
    };

    const formBody = new URLSearchParams({ jData: JSON.stringify(jData) }).toString();

    console.log('[LOG] Exit order jData:', jData);

    const kotakResponse = await fetch('https://mis.kotaksecurities.com/quick/order/rule/ms/place', {
      method: 'POST',
      headers: {
        'Auth': auth,
        'Sid': sid,
        'neo-fin-key': 'neotradeapi',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody
    });

    const kotakData = await kotakResponse.json();
    console.log('[LOG] Kotak exit order response:', kotakData);

    if (!kotakResponse.ok) {
      return res.status(kotakResponse.status).json({
        error: 'Kotak API error',
        details: kotakData
      });
    }

    const orderTypeDesc = priceType === 'MKT' ? 'Market' : `Limit @ ₹${price}`;
    return res.status(200).json({
      success: true,
      message: `Exit order placed: ${transactionType} ${absQuantity} ${tradingSymbol} (${orderTypeDesc})`,
      orderResponse: kotakData
    });

  } catch (error) {
    console.error('[ERROR] Error in exitPosition:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
