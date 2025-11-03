// /api/getSymbols.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { index } = req.query;

  console.log('[LOG] getSymbols called with index:', index);

  try {
    let symbols = [];

    // Hardcoded symbols - no file reading
    if (index === 'nifty') {
      symbols = [
        'NIFTY25N0426500CE',
        'NIFTY25N0426600CE',
        'NIFTY25N0426700CE',
        'NIFTY25N0426500PE',
        'NIFTY25N0426600PE',
        'NIFTY25N0426700PE',
      ];
    } else if (index === 'sensex') {
      symbols = [
        'SENSEX25N0685000CE',
        'SENSEX25N0686000CE',
        'SENSEX25N0687000CE',
        'SENSEX25N0685000PE',
        'SENSEX25N0687000PE',
        'SENSEX25N0687000PE',
      ];
    } else {
      console.error('[ERROR] Invalid index:', index);
      return res.status(400).json({ 
        error: 'Invalid index parameter',
        received: index,
        expected: 'nifty or sensex'
      });
    }

    console.log(`[LOG] ✓ Returning ${symbols.length} ${index} symbols`);

    return res.status(200).json({
      success: true,
      index: index,
      count: symbols.length,
      symbols: symbols,
      source: 'hardcoded'
    });
  } catch (error) {
    console.error('[ERROR] Error in getSymbols:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
