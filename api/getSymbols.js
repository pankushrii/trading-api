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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 // Log incoming request data for debugging
  console.log('Received getSymbol request body:', req.body);
  console.log('Received getSymbol request headers:', req.headers);

  const { index } = req.query;

  try {
    let symbols = [];
    let fileName = '';

    if (index === 'nifty') {
      fileName = 'nifty.txt';
    } else if (index === 'sensex') {
      fileName = 'sensex.txt';
    } else {
      return res.status(400).json({ error: 'Invalid index parameter. Use "nifty" or "sensex"' });
    }

    // Read from file in public directory
    const filePath = path.join(process.cwd(), 'public', fileName);
    
    console.log('[LOG] Reading symbols from:', filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('[ERROR] File not found:', filePath);
      return res.status(404).json({ 
        error: 'Symbol file not found',
        file: fileName,
        expectedPath: filePath
      });
    }

    // Read file contents
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Parse symbols (split by newline and filter empty lines)
    symbols = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log(`[LOG] Loaded ${symbols.length} ${index} symbols from file`);

    return res.status(200).json({
      success: true,
      index: index,
      count: symbols.length,
      symbols: symbols,
      fileName: fileName
    });
  } catch (error) {
    console.error('[ERROR] Error in getSymbols:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
