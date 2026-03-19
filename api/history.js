// Price history store — appends a snapshot each time a ticker is queried
// GET /api/history?ticker=KXNBA-26-SAS
//
// Uses Vercel KV if KV_REST_API_URL + KV_REST_API_TOKEN env vars are set,
// otherwise falls back to an in-memory Map (data resets on cold start).

const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';
const MAX_SNAPSHOTS = 30;

// Module-level Map persists across warm invocations on the same instance.
// Data is lost on cold start — acceptable for now.
const memoryStore = new Map();

async function getHistory(ticker) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      const data = await kv.get(`history:${ticker}`);
      return data || [];
    } catch {
      // fall through
    }
  }
  return memoryStore.get(ticker) || [];
}

async function setHistory(ticker, history) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(`history:${ticker}`, history);
      return;
    } catch {
      // fall through
    }
  }
  memoryStore.set(ticker, history);
}

export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'ticker query parameter is required' });
  }

  try {
    const response = await fetch(`${KALSHI_API}/markets/${ticker}`, {
      headers: { 'Accept': 'application/json' },
    });

    let price = null;
    if (response.ok) {
      const data = await response.json();
      const m = data.market || data;
      price = parseFloat(m.last_price_dollars || m.last_price || m.yes_bid_dollars || m.yes_bid || 0);
    }

    let history = await getHistory(ticker);

    if (price !== null && price > 0) {
      const now = Date.now();
      const lastTs = history.length > 0 ? history[history.length - 1].ts : 0;
      if (now - lastTs >= 30000) {
        history.push({ ts: now, price });
        if (history.length > MAX_SNAPSHOTS) {
          history = history.slice(-MAX_SNAPSHOTS);
        }
        await setHistory(ticker, history);
      }
    }

    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ ticker, history });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
