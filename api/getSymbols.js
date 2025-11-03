import symbols from './symbols.json' assert { type: 'json' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { index } = req.query;

  try {
    if (!index || !symbols[index]) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    const result = symbols[index];

    console.log(`[LOG] ✓ Returning ${result.length} ${index} symbols`);

    return res.status(200).json({
      success: true,
      index: index,
      count: result.length,
      symbols: result,
      source: 'json'
    });
  } catch (error) {
    console.error('[ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}
