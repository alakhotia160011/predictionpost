// Serverless proxy for Kalshi market data — avoids CORS 503s from browser
// GET /api/market?ticker=KXNBA-26-SAS

const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'ticker query parameter is required' });
  }

  try {
    const response = await fetch(`${KALSHI_API}/markets/${ticker}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Kalshi API returned ${response.status}` });
    }

    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
