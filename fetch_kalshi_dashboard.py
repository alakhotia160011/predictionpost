#!/usr/bin/env python3
"""
Kalshi Dashboard Data Fetcher
Fetches market data and outputs JSON for the newspaper dashboard
"""

import os
import json
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
from kalshi_python import KalshiClient, Configuration, MarketsApi

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Categories to fetch (series tickers)
SERIES_CONFIG = {
    # Economics
    'KXFEDCHAIRNOM': 'economics',
    'KXFEDDECISION': 'economics',
    'KXFED': 'economics',
    'KXGDP': 'economics',
    'KXGDPYEAR': 'economics',
    'KXCPI': 'economics',
    'KXPCECORE': 'economics',
    'KXRECSSNBER': 'economics',
    'KXGOVSHUT': 'economics',
    'KXLEAVEPOWELL': 'economics',
    'KXSP500': 'economics',
    # Politics
    'KXHOUSE': 'politics',
    'KXSENATE': 'politics',
    'KXAPRPOTUS': 'politics',
    'KXCABINET': 'politics',
    'KXGOVTCUTS': 'politics',
    'KXGREENLAND': 'politics',
    # Sports
    'KXSB': 'sports',
    'KXNFC': 'sports',
    'KXAFC': 'sports',
    'KXSBMVP': 'sports',
    'KXNBA': 'sports',
    'KXMLB': 'sports',
    'KXMARCH': 'sports',
    # Tech
    'KXBTC': 'tech',
    'KXBTCMAXY': 'tech',
    'KXETH': 'tech',
    'KXETHMAXY': 'tech',
    'KXTSLA': 'tech',
    'KXNVDA': 'tech',
    'KXTIKTOK': 'tech',
    'KXOPENAI': 'tech',
    # Culture
    'KXOSCARPIC': 'culture',
    'KXOSCARACTO': 'culture',
    'KXOSCARACTR': 'culture',
    'KXGRAMAOTY': 'culture',
    'KXGRAMROTY': 'culture',
    'KXGRAMBNA': 'culture',
    # Weather
    'KXHIGHNY': 'weather',
    'KXSNOW': 'weather',
    'KXHURRICANE': 'weather',
}


def get_category(ticker: str) -> str:
    """Determine category from ticker"""
    for series, category in SERIES_CONFIG.items():
        if ticker.startswith(series):
            return category
    return 'other'


def fetch_markets():
    """Fetch all open markets from Kalshi"""
    load_dotenv()
    
    api_key_id = os.getenv('KALSHI_API_KEY_ID')
    private_key_path = os.getenv('KALSHI_PRIVATE_KEY_PATH')
    env = os.getenv('KALSHI_ENV', 'prod')
    
    if not api_key_id or not private_key_path:
        raise ValueError("Set KALSHI_API_KEY_ID and KALSHI_PRIVATE_KEY_PATH in .env")
    
    # API host
    host = "https://demo-api.kalshi.co/trade-api/v2" if env == "demo" else "https://trading-api.kalshi.com/trade-api/v2"
    
    config = Configuration(host=host)
    client = KalshiClient(configuration=config)
    client.set_kalshi_auth(key_id=api_key_id, private_key_path=private_key_path)
    markets_api = MarketsApi(client)
    
    logger.info(f"Connected to Kalshi API ({env})")
    
    # Fetch all open markets
    all_markets = []
    cursor = None
    
    while True:
        response = markets_api.get_markets(status='open', limit=1000, cursor=cursor)
        
        if hasattr(response, 'markets') and response.markets:
            all_markets.extend(response.markets)
            logger.info(f"Fetched {len(all_markets)} markets...")
        
        if hasattr(response, 'cursor') and response.cursor:
            cursor = response.cursor
        else:
            break
    
    logger.info(f"Total: {len(all_markets)} open markets")
    return all_markets


def process_markets(markets) -> dict:
    """Process markets into dashboard format"""
    
    dashboard_data = {
        'economics': [],
        'politics': [],
        'sports': [],
        'tech': [],
        'culture': [],
        'weather': [],
        'other': [],
    }
    
    for m in markets:
        ticker = getattr(m, 'ticker', '')
        category = get_category(ticker)
        
        # Get prices (in cents)
        yes_bid = getattr(m, 'yes_bid', 0) or 0
        yes_ask = getattr(m, 'yes_ask', 0) or 0
        # Use midpoint or bid as price
        yes_price = yes_bid if yes_bid else (yes_ask - 1 if yes_ask else 50)
        
        volume = getattr(m, 'volume', 0) or 0
        volume_24h = getattr(m, 'volume_24h', 0) or 0
        
        # Skip low volume markets
        if volume < 1000 and volume_24h < 100:
            continue
        
        market_data = {
            'ticker': ticker,
            'title': getattr(m, 'title', ticker),
            'yes_price': yes_price / 100,  # Convert to decimal
            'volume': volume,
            'volume_24h': volume_24h,
            'category': category,
            'url': f"https://kalshi.com/markets/{ticker.split('-')[0].lower()}",
        }
        
        dashboard_data[category].append(market_data)
    
    # Sort each category by volume
    for cat in dashboard_data:
        dashboard_data[cat].sort(key=lambda x: x['volume'], reverse=True)
        # Keep top 20 per category
        dashboard_data[cat] = dashboard_data[cat][:20]
    
    return dashboard_data


def main():
    """Main entry point"""
    try:
        markets = fetch_markets()
        data = process_markets(markets)
        
        # Count markets
        total = sum(len(v) for v in data.values())
        logger.info(f"Processed {total} markets for dashboard")
        
        # Output as JSON
        output = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'markets': data,
        }
        
        # Save to file
        with open('kalshi_dashboard_data.json', 'w') as f:
            json.dump(output, f, indent=2)
        logger.info("Saved to kalshi_dashboard_data.json")
        
        # Also print for piping
        print(json.dumps(output, indent=2))
        
    except Exception as e:
        logger.error(f"Failed: {e}", exc_info=True)
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())
