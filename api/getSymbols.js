import fs from 'fs';
import path from 'path';

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
    let symbols = [];
    let fileName = '';

    if (index === 'nifty') {
      fileName = 'nifty.txt';
    } else if (index === 'sensex') {
      fileName = 'sensex.txt';
    } else {
      return res.status(400).json({ error: 'Invalid index. Use "nifty" or "sensex"' });
    }

    // Read from SAME FOLDER as this API file (/api)
    const filePath = path.join(__dirname, fileName);
    
    console.log('[LOG] Reading from:', filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('[ERROR] File not found:', filePath);
      
      // Fallback to hardcoded if file doesn't exist
      symbols = index === 'nifty' 
        ? ['NIFTY25N0426500CE', 'NIFTY25N0426600CE', 'NIFTY25N0426700CE', 'NIFTY25N0426500PE', 'NIFTY25N0426600PE', 'NIFTY25N0426700PE']
        : ['SENSEX25N0685000CE', 'SENSEX25N0686000CE', 'SENSEX25N0687000CE', 'SENSEX25N0685000PE', 'SENSEX25N0687000PE', 'SENSEX25N0687000PE'];
      
      console.log('[LOG] Using fallback symbols');
      return res.status(200).json({
        success: true,
        index: index,
        count: symbols.length,
        symbols: symbols,
        source: 'fallback'
      });
    }

    // Read file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    symbols = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log(`[LOG] ✓ Loaded ${symbols.length} ${index} symbols from file`);

    return res.status(200).json({
      success: true,
      index: index,
      count: symbols.length,
      symbols: symbols,
      source: 'file'
    });
  } catch (error) {
    console.error('[ERROR]', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
