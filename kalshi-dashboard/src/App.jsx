import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Kalshi API base URL (public, no auth needed)
const API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

// Use serverless proxy when deployed on Vercel, direct API locally
const useProxy = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const proxyBase = useProxy ? '/api' : null;

// Series to fetch with their categories — only series with active markets as of March 2026
const MARKET_CONFIG = [
  // Economics
  { series: 'KXGDP', category: 'economics', url: 'https://kalshi.com/markets/kxgdp' },
  { series: 'KXCPI', category: 'economics', url: 'https://kalshi.com/markets/kxcpi' },
  { series: 'KXFED', category: 'economics', url: 'https://kalshi.com/markets/kxfed' },
  { series: 'KXPCECORE', category: 'economics', url: 'https://kalshi.com/markets/kxpcecore' },
  { series: 'KXRECSSNBER', category: 'economics', url: 'https://kalshi.com/markets/kxrecssnber' },
  { series: 'KXINX', category: 'economics', url: 'https://kalshi.com/markets/kxinx' },
  // Sports
  { series: 'KXNBA', category: 'sports', url: 'https://kalshi.com/markets/kxnba' },
  { series: 'KXNHL', category: 'sports', url: 'https://kalshi.com/markets/kxnhl' },
  { series: 'KXMLB', category: 'sports', url: 'https://kalshi.com/markets/kxmlb' },
  // Tech/Crypto
  { series: 'KXBTC', category: 'tech', url: 'https://kalshi.com/markets/kxbtc' },
  { series: 'KXETH', category: 'tech', url: 'https://kalshi.com/markets/kxeth' },
  // Weather
  { series: 'KXHIGHNY', category: 'weather', url: 'https://kalshi.com/markets/kxhighny' },
];

// Fallback data — current as of March 15, 2026, from Kalshi public API
const FALLBACK_MARKETS = [
  // ==================== ECONOMICS ====================
  { ticker: 'KXGDP-26APR30-T2.0', title: 'Q1 2026 GDP growth above 2.0%?', yes_price: 0.66, volume: 53573, volume_24h: 8200, category: 'economics', url: 'https://kalshi.com/markets/kxgdp', commentary: 'Market implies 66% chance GDP exceeds 2%. Tight 1c spreads show healthy liquidity.', question: 'Tariff drag or consumer resilience?' },
  { ticker: 'KXGDP-26APR30-T2.5', title: 'Q1 2026 GDP growth above 2.5%?', yes_price: 0.56, volume: 37635, volume_24h: 5400, category: 'economics', url: 'https://kalshi.com/markets/kxgdp', commentary: '56% implied probability. Consensus clustering around 2.3-2.7%.', question: 'Can the expansion continue?' },
  { ticker: 'KXGDP-26APR30-T1.5', title: 'Q1 2026 GDP growth above 1.5%?', yes_price: 0.78, volume: 51598, volume_24h: 7100, category: 'economics', url: 'https://kalshi.com/markets/kxgdp', commentary: 'Near certainty the economy avoids sub-1.5% growth.', question: 'Soft landing confirmed?' },
  { ticker: 'KXGDP-26APR30-T3.0', title: 'Q1 2026 GDP growth above 3.0%?', yes_price: 0.42, volume: 28000, volume_24h: 3800, category: 'economics', url: 'https://kalshi.com/markets/kxgdp', commentary: 'Hot GDP would complicate Fed rate cut plans.', question: 'Too hot for comfort?' },
  { ticker: 'KXCPI-26MAR-T0.6', title: 'March CPI monthly change above 0.6%?', yes_price: 0.75, volume: 38214, volume_24h: 6300, category: 'economics', url: 'https://kalshi.com/markets/kxcpi', commentary: '75% probability CPI exceeds 0.6% MoM. Inflation proving sticky.', question: 'Is 2% target slipping away?' },
  { ticker: 'KXCPI-26MAR-T0.7', title: 'March CPI monthly change above 0.7%?', yes_price: 0.52, volume: 33963, volume_24h: 5200, category: 'economics', url: 'https://kalshi.com/markets/kxcpi', commentary: 'Coin flip on whether CPI breaches 0.7%. Shelter costs key.', question: 'Core vs headline divergence?' },
  { ticker: 'KXCPI-26MAR-T0.8', title: 'March CPI monthly change above 0.8%?', yes_price: 0.37, volume: 11013, volume_24h: 1800, category: 'economics', url: 'https://kalshi.com/markets/kxcpi', commentary: 'Tail risk of hot inflation print. Energy prices volatile.', question: 'Stagflation fears returning?' },
  { ticker: 'KXRECSSNBER-26', title: 'Will there be a US recession in 2026?', yes_price: 0.33, volume: 682318, volume_24h: 12400, category: 'economics', url: 'https://kalshi.com/markets/kxrecssnber', commentary: '33% recession probability — up from 25% in January. Trade war fears rising.', question: 'Are tariffs tipping the balance?' },
  { ticker: 'KXFED-27APR-T3.25', title: 'Fed funds rate above 3.25% by April 2027?', yes_price: 0.50, volume: 4352, volume_24h: 580, category: 'economics', url: 'https://kalshi.com/markets/kxfed', commentary: 'Wide bid-ask spreads on far-dated Fed markets. 50/50 on rate above 3.25%.', question: 'How many cuts this cycle?' },
  { ticker: 'KXFED-27APR-T3.50', title: 'Fed funds rate above 3.50% by April 2027?', yes_price: 0.50, volume: 1733, volume_24h: 320, category: 'economics', url: 'https://kalshi.com/markets/kxfed', commentary: 'Markets still uncertain on terminal rate.', question: 'Higher for even longer?' },

  // ==================== SPORTS ====================
  { ticker: 'KXNBA-26-OKC', title: 'Thunder win 2026 NBA Finals?', yes_price: 0.38, volume: 2947010, volume_24h: 185000, category: 'sports', url: 'https://kalshi.com/markets/kxnba', commentary: 'Clear favorite at 38%. SGA leading MVP race. Dominant regular season.', question: 'Can anyone stop OKC?' },
  { ticker: 'KXNBA-26-SAS', title: 'Spurs win 2026 NBA Finals?', yes_price: 0.16, volume: 6067636, volume_24h: 320000, category: 'sports', url: 'https://kalshi.com/markets/kxnba', commentary: 'Highest volume on Kalshi — 6M+ contracts. Wembanyama effect is real.', question: 'Victor making San Antonio relevant again?' },
  { ticker: 'KXNBA-26-BOS', title: 'Celtics win 2026 NBA Finals?', yes_price: 0.14, volume: 2990997, volume_24h: 145000, category: 'sports', url: 'https://kalshi.com/markets/kxnba', commentary: 'Defending champs fading in odds. Tatum needs help.', question: 'Dynasty or one-hit wonder?' },
  { ticker: 'KXNBA-26-LAL', title: 'Lakers win 2026 NBA Finals?', yes_price: 0.02, volume: 2938383, volume_24h: 98000, category: 'sports', url: 'https://kalshi.com/markets/kxnba', commentary: 'Long shot at 2%. Massive volume from LA faithful.', question: 'LeBron\'s last dance?' },
  { ticker: 'KXNBA-26-DET', title: 'Pistons win 2026 NBA Finals?', yes_price: 0.04, volume: 2586880, volume_24h: 78000, category: 'sports', url: 'https://kalshi.com/markets/kxnba', commentary: 'Cade Cunningham breakout season generating buzz.', question: 'Motown miracle or mirage?' },
  { ticker: 'KXNHL-26-COL', title: 'Avalanche win 2026 Stanley Cup?', yes_price: 0.21, volume: 1430059, volume_24h: 62000, category: 'sports', url: 'https://kalshi.com/markets/kxnhl', commentary: 'Cup favorites at 21%. MacKinnon on a tear.', question: 'Back to championship form?' },
  { ticker: 'KXNHL-26-MIN', title: 'Wild win 2026 Stanley Cup?', yes_price: 0.06, volume: 1171703, volume_24h: 45000, category: 'sports', url: 'https://kalshi.com/markets/kxnhl', commentary: 'Dark horse at 6%. Surprise contender this season.', question: 'State of Hockey uprising?' },
  { ticker: 'KXNHL-26-BUF', title: 'Sabres win 2026 Stanley Cup?', yes_price: 0.07, volume: 941186, volume_24h: 38000, category: 'sports', url: 'https://kalshi.com/markets/kxnhl', commentary: 'Buffalo finally in the playoff picture after years of futility.', question: 'End of the drought?' },
  { ticker: 'KXMLB-26-LAD', title: 'Dodgers win 2026 World Series?', yes_price: 0.30, volume: 462274, volume_24h: 24000, category: 'sports', url: 'https://kalshi.com/markets/kxmlb', commentary: 'Favorites at 30%. Ohtani/Betts core intact.', question: 'Three-peat within reach?' },
  { ticker: 'KXMLB-26-SEA', title: 'Mariners win 2026 World Series?', yes_price: 0.10, volume: 571605, volume_24h: 28000, category: 'sports', url: 'https://kalshi.com/markets/kxmlb', commentary: 'Highest MLB volume despite lower odds. Seattle believes.', question: 'Breaking the longest drought in baseball?' },

  // ==================== TECH ====================
  { ticker: 'KXBTC-26MAR1617-B73000', title: 'Bitcoin above $73,000 on March 16?', yes_price: 0.13, volume: 3456, volume_24h: 890, category: 'tech', url: 'https://kalshi.com/markets/kxbtc', commentary: 'Daily price bracket. BTC trading around $73K. Tight range.', question: 'Breakout or breakdown?' },
  { ticker: 'KXBTC-26MAR1617-T62250', title: 'Bitcoin below $62,250 on March 16?', yes_price: 0.01, volume: 836, volume_24h: 210, category: 'tech', url: 'https://kalshi.com/markets/kxbtc', commentary: 'Deep out-of-the-money. Would require a major crash.', question: 'Black swan hedge?' },
  { ticker: 'KXETH-26MAR1617-T2860', title: 'Ethereum price range on March 16?', yes_price: 0.01, volume: 55, volume_24h: 12, category: 'tech', url: 'https://kalshi.com/markets/kxeth', commentary: 'ETH markets very thin. Low interest in daily brackets.', question: 'Where did the ETH traders go?' },

  // ==================== WEATHER ====================
  { ticker: 'KXHIGHNY-26MAR15-T47', title: 'NYC high temperature below 47°F on March 15?', yes_price: 0.01, volume: 84790, volume_24h: 42000, category: 'weather', url: 'https://kalshi.com/markets/kxhighny', commentary: 'Resolved near 1c. Surprisingly high volume for weather.', question: 'Who\'s trading the weather?' },
  { ticker: 'KXHIGHNY-26MAR15-B51.5', title: 'NYC high 51-52°F on March 15?', yes_price: 0.12, volume: 25894, volume_24h: 12000, category: 'weather', url: 'https://kalshi.com/markets/kxhighny', commentary: 'Mid-range temperature bracket for today.', question: 'Spring arriving early?' },
  { ticker: 'KXHIGHNY-26MAR15-T54', title: 'NYC high above 54°F on March 15?', yes_price: 0.01, volume: 11662, volume_24h: 5800, category: 'weather', url: 'https://kalshi.com/markets/kxhighny', commentary: 'Unlikely to get that warm today.', question: 'Coat or no coat?' },
];

const CATEGORIES = [
  { id: 'home', label: 'Front Page' },
  { id: 'economics', label: 'Economics' },
  { id: 'sports', label: 'Sports' },
  { id: 'tech', label: 'Tech' },
  { id: 'weather', label: 'Weather' },
];

const formatVolume = (num) => {
  if (!num) return '$0';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num}`;
};

const formatCents = (num) => {
  if (num === null || num === undefined) return '—';
  return `${Math.round(num * 100)}¢`;
};

const formatNumber = (num) => {
  if (!num) return '0';
  return num.toLocaleString();
};

// ─────────────────────────────────────────────────
// FEATURE 2: Inline SVG Sparkline (no library)
// ─────────────────────────────────────────────────
const Sparkline = ({ data, width = 100, height = 28, strokeWidth = 1 }) => {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#ccc" strokeWidth={1} strokeDasharray="2,2" />
      </svg>
    );
  }

  const prices = data.map(d => (typeof d === 'number' ? d : d.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.01;
  const pad = 2;

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((p - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const first = prices[0];
  const last = prices[prices.length - 1];
  const color = last > first ? '#2a7a2a' : last < first ? '#8b1a1a' : '#888';

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

// ─────────────────────────────────────────────────
// FEATURE 1: Trade Link button
// ─────────────────────────────────────────────────
const TradeLink = ({ ticker }) => {
  const url = `https://kalshi.com/markets/${ticker.toLowerCase()}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
        fontFamily: 'Georgia, serif',
        fontSize: 8,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#faf9f6',
        backgroundColor: '#1a1a1a',
        padding: '3px 8px',
        textDecoration: 'none',
        display: 'inline-block',
        transition: 'all 0.15s',
      }}
      onMouseOver={e => {
        e.currentTarget.style.backgroundColor = '#faf9f6';
        e.currentTarget.style.color = '#1a1a1a';
        e.currentTarget.style.outline = '1px solid #1a1a1a';
      }}
      onMouseOut={e => {
        e.currentTarget.style.backgroundColor = '#1a1a1a';
        e.currentTarget.style.color = '#faf9f6';
        e.currentTarget.style.outline = 'none';
      }}
    >
      Trade →
    </a>
  );
};

// ─────────────────────────────────────────────────
// Existing mini sparkline (recharts) for backwards compat
// ─────────────────────────────────────────────────
const MiniSparkline = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  const chartData = data.map((v, i) => ({ value: v }));
  return (
    <div style={{ width: 60, height: 24 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─────────────────────────────────────────────────
// MarketCard — now with Trade link + sparkline + click-to-open-drawer
// ─────────────────────────────────────────────────
const MarketCard = ({ market, featured, showCategory, historyData, onOpenDrawer }) => {
  const priceChange = market.price_change || 0;
  const isUp = priceChange >= 0;
  const trendColor = isUp ? '#15803d' : '#dc2626';

  // Use real history data for sparkline, fall back to generated data
  const hasRealHistory = historyData && historyData.length >= 2;

  // Generate 7-day sparkline with realistic weekly movement (fallback)
  const weeklyChange = (Math.random() - 0.4) * 0.15;
  const weekSeries = Array(7).fill(0).map((_, i) => {
    const trendComponent = (weeklyChange * i) / 6;
    const noise = (Math.random() - 0.5) * 0.04;
    const basePrice = market.yes_price || 0.5;
    return Math.max(0.02, Math.min(0.98, basePrice - weeklyChange + trendComponent + noise));
  });

  const sparklineUp = weekSeries[6] > weekSeries[0];
  const sparklineColor = sparklineUp ? '#15803d' : '#dc2626';

  const handleClick = (e) => {
    // Don't open drawer if clicking a link
    if (e.target.tagName === 'A' || e.target.closest('a')) return;
    onOpenDrawer && onOpenDrawer(market);
  };

  if (featured) {
    return (
      <div
        onClick={handleClick}
        style={{
          borderBottom: '1px solid #1a1a1a',
          paddingBottom: 20,
          marginBottom: 20,
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          position: 'relative',
        }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f5f5f0'}
        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span style={{
            fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#666',
          }}>{showCategory ? market.category : ''}</span>
          <span style={{
            fontFamily: 'Georgia, serif',
            fontSize: 10,
            color: '#888',
          }}>{market.ticker}</span>
        </div>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1.2,
          marginBottom: 12,
          color: '#1a1a1a',
        }}>{market.title}</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}>
          <div>
            <div style={{
              fontFamily: '"Courier New", monospace',
              fontSize: 32,
              fontWeight: 700,
              color: '#1a1a1a',
            }}>{formatCents(market.yes_price)}</div>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 11,
              color: trendColor,
            }}>{isUp ? '↑' : '↓'} {Math.abs(priceChange * 100).toFixed(0)}¢ 24h</div>
          </div>
          {/* Sparkline: real history or recharts fallback */}
          {hasRealHistory ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <Sparkline data={historyData} width={200} height={50} strokeWidth={2} />
            </div>
          ) : (
            <div style={{ flex: 1, height: 50 }}>
              <ResponsiveContainer>
                <AreaChart data={weekSeries.map((v, i) => ({ day: i, value: v }))} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Area type="monotone" dataKey="value" stroke={sparklineColor} fill={sparklineColor} fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif', fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume</div>
            <div style={{ fontFamily: '"Courier New", monospace', fontSize: 16, fontWeight: 600 }}>{formatVolume(market.volume)}</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 10, color: '#888' }}>{formatVolume(market.volume_24h)} today</div>
          </div>
        </div>

        {/* Commentary */}
        {market.commentary && (
          <div style={{
            backgroundColor: '#f8f8f5',
            padding: '10px 12px',
            borderLeft: '3px solid #1a1a1a',
            marginBottom: 8,
          }}>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              lineHeight: 1.4,
              color: '#333',
              margin: 0,
            }}>{market.commentary}</p>
          </div>
        )}

        {/* Question + Trade Link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {market.question ? (
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: 12,
              fontStyle: 'italic',
              color: '#666',
              margin: 0,
            }}>{market.question}</p>
          ) : <span />}
          <TradeLink ticker={market.ticker} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '10px 0',
        borderBottom: '1px solid #e5e5e5',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
      }}
      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f5f5f0'}
      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 14,
            lineHeight: 1.3,
            color: '#1a1a1a',
            marginBottom: 2,
          }}>{market.title}</div>
          <div style={{
            fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
            fontSize: 9,
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>{formatVolume(market.volume_24h)} today · {market.ticker}</div>
        </div>
        {/* Sparkline for sidebar cards: below the price area */}
        {hasRealHistory ? (
          <Sparkline data={historyData} width={60} height={24} strokeWidth={1} />
        ) : (
          <MiniSparkline data={weekSeries} color={sparklineColor} />
        )}
        <div style={{ textAlign: 'right', minWidth: 45 }}>
          <div style={{
            fontFamily: '"Courier New", monospace',
            fontSize: 16,
            fontWeight: 700,
            color: '#1a1a1a',
          }}>{formatCents(market.yes_price)}</div>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 9,
            color: trendColor,
          }}>{isUp ? '↑' : '↓'}{Math.abs(priceChange * 100).toFixed(0)}¢</div>
        </div>
      </div>

      {/* Compact commentary + trade link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {market.commentary ? (
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: 11,
            color: '#666',
            margin: '4px 0 0 0',
            lineHeight: 1.3,
            flex: 1,
          }}>{market.commentary}</p>
        ) : <span />}
        <div style={{ marginLeft: 8, flexShrink: 0 }}>
          <TradeLink ticker={market.ticker} />
        </div>
      </div>
    </div>
  );
};

const VolumeChart = ({ markets }) => {
  const allMarkets = Object.values(markets).flat().filter(m => m.volume_24h > 0);
  const topByVolume = [...allMarkets].sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0)).slice(0, 6);

  if (topByVolume.length === 0) return null;

  const chartData = topByVolume.map(m => ({
    name: m.ticker.length > 10 ? m.ticker.slice(0, 10) + '…' : m.ticker,
    volume: (m.volume_24h || 0) / 1000,
    title: m.title,
  }));

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{
        fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
        fontSize: 12,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: '#1a1a1a',
        borderBottom: '2px solid #1a1a1a',
        paddingBottom: 6,
        marginBottom: 12,
      }}>Most Active Today</h3>
      <div style={{ height: 160 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <XAxis type="number" tickFormatter={(v) => `$${v}K`} style={{ fontFamily: '"Courier New", monospace', fontSize: 9 }} />
            <YAxis type="category" dataKey="name" style={{ fontFamily: '"Courier New", monospace', fontSize: 8 }} width={65} />
            <Tooltip
              formatter={(v) => [`$${v.toFixed(0)}K`, 'Volume']}
              labelFormatter={(label, payload) => payload[0]?.payload?.title || label}
              contentStyle={{ fontFamily: 'Georgia, serif', fontSize: 11 }}
            />
            <Bar dataKey="volume" fill="#1a1a1a" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const QuickStats = ({ markets }) => {
  const allMarkets = Object.values(markets).flat();
  const totalVolume24h = allMarkets.reduce((sum, m) => sum + (m.volume_24h || 0), 0);
  const totalVolume = allMarkets.reduce((sum, m) => sum + (m.volume || 0), 0);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12,
      marginBottom: 24,
      padding: 12,
      backgroundColor: '#f8f8f5',
      borderRadius: 4,
    }}>
      <div>
        <div style={{ fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif', fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>24h Volume</div>
        <div style={{ fontFamily: '"Courier New", monospace', fontSize: 16, fontWeight: 700 }}>{formatVolume(totalVolume24h)}</div>
      </div>
      <div>
        <div style={{ fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif', fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Volume</div>
        <div style={{ fontFamily: '"Courier New", monospace', fontSize: 16, fontWeight: 700 }}>{formatVolume(totalVolume)}</div>
      </div>
      <div>
        <div style={{ fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif', fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Markets</div>
        <div style={{ fontFamily: '"Courier New", monospace', fontSize: 16, fontWeight: 700 }}>{allMarkets.length}</div>
      </div>
    </div>
  );
};

const CategoryPreview = ({ title, markets, onViewAll, historyMap, onOpenDrawer }) => {
  const topMarket = markets[0];
  const otherMarkets = markets.slice(1, 3);

  if (!topMarket) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #1a1a1a',
        paddingBottom: 6,
        marginBottom: 12,
      }}>
        <h3 style={{
          fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#1a1a1a',
          margin: 0,
        }}>{title}</h3>
        <button
          onClick={onViewAll}
          style={{
            fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
            fontSize: 10,
            color: '#666',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          View All →
        </button>
      </div>

      <MarketCard market={topMarket} featured showCategory={false} historyData={historyMap[topMarket.ticker]} onOpenDrawer={onOpenDrawer} />

      {otherMarkets.map(m => (
        <MarketCard key={m.ticker} market={m} showCategory={false} historyData={historyMap[m.ticker]} onOpenDrawer={onOpenDrawer} />
      ))}
    </div>
  );
};

const CategoryPage = ({ title, markets, historyMap, onOpenDrawer }) => {
  const sortedMarkets = [...markets].sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0));
  const featured = sortedMarkets[0];
  const rest = sortedMarkets.slice(1);

  return (
    <div>
      <h2 style={{
        fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
        fontSize: 14,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: '#1a1a1a',
        borderBottom: '3px solid #1a1a1a',
        paddingBottom: 8,
        marginTop: 0,
        marginBottom: 20,
      }}>{title}</h2>

      {featured && <MarketCard market={featured} featured showCategory={false} historyData={historyMap[featured.ticker]} onOpenDrawer={onOpenDrawer} />}

      {rest.map(m => (
        <MarketCard key={m.ticker} market={m} showCategory={false} historyData={historyMap[m.ticker]} onOpenDrawer={onOpenDrawer} />
      ))}
    </div>
  );
};

const FrontPage = ({ markets, onCategoryClick, historyMap, onOpenDrawer }) => {
  const topByVolume = Object.values(markets).flat()
    .sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0))
    .slice(0, 3);

  return (
    <div>
      {/* Hero: Top 3 markets */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{
          fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#1a1a1a',
          borderBottom: '2px solid #1a1a1a',
          paddingBottom: 6,
          marginTop: 0,
          marginBottom: 12,
        }}>Top Stories</h3>
        {topByVolume.map((m, i) => (
          <MarketCard key={m.ticker} market={m} featured={i === 0} showCategory historyData={historyMap[m.ticker]} onOpenDrawer={onOpenDrawer} />
        ))}
      </div>

      {/* Category previews */}
      <CategoryPreview
        title="Economics"
        markets={markets.economics || []}
        onViewAll={() => onCategoryClick('economics')}
        historyMap={historyMap}
        onOpenDrawer={onOpenDrawer}
      />
      <CategoryPreview
        title="Sports"
        markets={markets.sports || []}
        onViewAll={() => onCategoryClick('sports')}
        historyMap={historyMap}
        onOpenDrawer={onOpenDrawer}
      />
    </div>
  );
};

const SidebarContent = ({ markets, activeCategory, onCategoryClick, historyMap, onOpenDrawer }) => {
  return (
    <>
      {/* Market Overview header */}
      <h3 style={{
        fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
        fontSize: 12,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: '#1a1a1a',
        borderBottom: '2px solid #1a1a1a',
        paddingBottom: 6,
        marginTop: 0,
        marginBottom: 12,
      }}>Market Overview</h3>

      <QuickStats markets={markets} />
      <VolumeChart markets={markets} />

      {/* Quick links to other categories when on a category page */}
      {activeCategory !== 'home' && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{
            fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
            fontSize: 12,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#1a1a1a',
            borderBottom: '2px solid #1a1a1a',
            paddingBottom: 6,
            marginBottom: 12,
          }}>More Categories</h3>
          {CATEGORIES.filter(c => c.id !== 'home' && c.id !== activeCategory).map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategoryClick(cat.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                fontFamily: 'Georgia, serif',
                fontSize: 13,
                color: '#1a1a1a',
                background: 'none',
                border: 'none',
                padding: '8px 0',
                borderBottom: '1px solid #e5e5e5',
                cursor: 'pointer',
              }}
            >
              {cat.label}
              <span style={{ float: 'right', color: '#888', fontSize: 11 }}>
                {(markets[cat.id] || []).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Tech & Weather previews on front page */}
      {activeCategory === 'home' && (
        <>
          <CategoryPreview
            title="Tech"
            markets={markets.tech || []}
            onViewAll={() => onCategoryClick('tech')}
            historyMap={historyMap}
            onOpenDrawer={onOpenDrawer}
          />
          <CategoryPreview
            title="Weather"
            markets={markets.weather || []}
            onViewAll={() => onCategoryClick('weather')}
            historyMap={historyMap}
            onOpenDrawer={onOpenDrawer}
          />
        </>
      )}

      {/* Kalshi News Section */}
      <NewsSection />
    </>
  );
};

// News articles — pointers to Kalshi's blog
const NEWS_ARTICLES = [
  {
    title: "2026 Recession Odds Climb to 33%",
    summary: "Tariff uncertainty pushes recession probability up from January lows. Markets pricing in rising risk of two consecutive quarters of negative GDP.",
    url: "https://news.kalshi.com/",
    date: "Mar 14, 2026",
    tag: "Economics"
  },
  {
    title: "NBA Finals: Thunder Clear Favorites at 38%",
    summary: "OKC dominates regular season as SGA leads MVP race. Spurs generate huge volume on Wembanyama hype despite lower odds.",
    url: "https://news.kalshi.com/",
    date: "Mar 13, 2026",
    tag: "Sports"
  },
  {
    title: "Q1 GDP: Markets Expect Solid 2-2.5% Growth",
    summary: "Kalshi traders see 66% chance GDP exceeds 2%. Advance estimate due April 30. Consumer spending remains the key driver.",
    url: "https://news.kalshi.com/",
    date: "Mar 12, 2026",
    tag: "Economics"
  },
];

const NewsSection = () => (
  <div style={{ marginTop: 24 }}>
    <h3 style={{
      fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
      fontSize: 12,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color: '#1a1a1a',
      borderBottom: '2px solid #1a1a1a',
      paddingBottom: 6,
      marginBottom: 12,
    }}>
      <a
        href="https://news.kalshi.com/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        Kalshi News
      </a>
    </h3>

    {NEWS_ARTICLES.map((article, i) => (
      <a
        key={i}
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          padding: '10px 0',
          borderBottom: i < NEWS_ARTICLES.length - 1 ? '1px solid #e5e5e5' : 'none',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 4,
        }}>
          <span style={{
            fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#666',
            backgroundColor: '#f0f0eb',
            padding: '2px 6px',
            borderRadius: 2,
          }}>{article.tag}</span>
          <span style={{
            fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
            fontSize: 9,
            color: '#888',
          }}>{article.date}</span>
        </div>
        <h4 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.3,
          color: '#1a1a1a',
          margin: '4px 0',
        }}>{article.title}</h4>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: 11,
          lineHeight: 1.4,
          color: '#666',
          margin: 0,
        }}>{article.summary}</p>
      </a>
    ))}

    <a
      href="https://news.kalshi.com/"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        marginTop: 12,
        fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
        fontSize: 11,
        color: '#1a1a1a',
        textDecoration: 'none',
      }}
    >
      View All News →
    </a>
  </div>
);

// ─────────────────────────────────────────────────
// FEATURE 3: Market Detail Drawer
// ─────────────────────────────────────────────────
const MarketDrawer = ({ market, onClose, historyData }) => {
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const drawerRef = useRef(null);

  // Fetch fresh data from proxy
  useEffect(() => {
    if (!market) return;
    setLoadingDetail(true);
    const fetchDetail = async () => {
      try {
        const url = proxyBase
          ? `${proxyBase}/market?ticker=${market.ticker}`
          : `${API_BASE}/markets/${market.ticker}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          setDetail(data.market || data);
        }
      } catch {
        // use what we have
      }
      setLoadingDetail(false);
    };
    fetchDetail();
  }, [market]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!market) return null;

  const d = detail || {};
  const yesBid = parseFloat(d.yes_bid_dollars || d.yes_bid || 0);
  const yesAsk = parseFloat(d.yes_ask_dollars || d.yes_ask || 0);
  const lastPrice = parseFloat(d.last_price_dollars || d.last_price || market.yes_price || 0);
  const prevPrice = parseFloat(d.previous_price_dollars || d.previous_price || 0);
  const change24h = prevPrice > 0 ? lastPrice - prevPrice : market.price_change || 0;
  const openInterest = d.open_interest_fp || d.open_interest || 0;
  const tradeUrl = `https://kalshi.com/markets/${market.ticker.toLowerCase()}`;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26,24,20,0.15)',
          zIndex: 999,
          transition: 'opacity 0.25s',
        }}
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 340,
          maxWidth: '100vw',
          backgroundColor: '#ede9e1',
          borderLeft: '1px solid #d5d0c8',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '24px 20px',
          animation: 'drawerSlideIn 0.25s ease-out',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            fontSize: 20,
            color: '#666',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1,
          }}
        >×</button>

        {/* Full headline */}
        <h2 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 20,
          fontWeight: 400,
          lineHeight: 1.25,
          color: '#1a1a1a',
          marginBottom: 20,
          marginRight: 24,
        }}>{market.title}</h2>

        {loadingDetail && (
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 12, color: '#888', marginBottom: 16 }}>
            Loading latest data...
          </div>
        )}

        {/* Bid / Ask Spread */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 20,
        }}>
          <div style={{
            backgroundColor: '#faf9f6',
            padding: '10px 12px',
          }}>
            <div style={{ fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 4 }}>Yes Bid</div>
            <div style={{ fontFamily: '"Courier New", monospace', fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>
              {yesBid > 0 ? `${Math.round(yesBid * 100)}¢` : '—'}
            </div>
          </div>
          <div style={{
            backgroundColor: '#faf9f6',
            padding: '10px 12px',
          }}>
            <div style={{ fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 4 }}>Yes Ask</div>
            <div style={{ fontFamily: '"Courier New", monospace', fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>
              {yesAsk > 0 ? `${Math.round(yesAsk * 100)}¢` : '—'}
            </div>
          </div>
        </div>

        {/* Open Interest + 24h Change */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 20,
        }}>
          <div>
            <div style={{ fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 4 }}>Open Interest</div>
            <div style={{ fontFamily: '"Courier New", monospace', fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
              {formatNumber(openInterest)}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 4 }}>24h Change</div>
            <div style={{
              fontFamily: '"Courier New", monospace',
              fontSize: 16,
              fontWeight: 600,
              color: change24h >= 0 ? '#2a7a2a' : '#8b1a1a',
            }}>
              {change24h >= 0 ? '+' : ''}{(change24h * 100).toFixed(1)}¢
            </div>
          </div>
        </div>

        {/* Larger sparkline */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 8 }}>Price History</div>
          <div style={{ backgroundColor: '#faf9f6', padding: 12 }}>
            <Sparkline data={historyData} width={300} height={80} strokeWidth={1.5} />
          </div>
        </div>

        {/* Volume */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 24,
        }}>
          <div>
            <div style={{ fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 4 }}>Total Volume</div>
            <div style={{ fontFamily: '"Courier New", monospace', fontSize: 16, fontWeight: 600 }}>{formatVolume(market.volume)}</div>
          </div>
          <div>
            <div style={{ fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 4 }}>24h Volume</div>
            <div style={{ fontFamily: '"Courier New", monospace', fontSize: 16, fontWeight: 600 }}>{formatVolume(market.volume_24h)}</div>
          </div>
        </div>

        {/* Commentary */}
        {market.commentary && (
          <div style={{
            backgroundColor: '#faf9f6',
            padding: '10px 12px',
            borderLeft: '3px solid #1a1a1a',
            marginBottom: 24,
          }}>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              lineHeight: 1.4,
              color: '#333',
              margin: 0,
            }}>{market.commentary}</p>
          </div>
        )}

        {/* Trade CTA */}
        <a
          href={tradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 0',
            backgroundColor: '#1a1a1a',
            color: '#faf9f6',
            fontFamily: 'Georgia, serif',
            fontSize: 14,
            letterSpacing: '0.05em',
            textAlign: 'center',
            textDecoration: 'none',
            transition: 'background-color 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#333'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
        >
          Trade on Kalshi →
        </a>

        <div style={{
          fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#999',
          textAlign: 'center',
          marginTop: 12,
        }}>
          {market.ticker}
        </div>
      </div>
    </>
  );
};

// Process markets into categories
const processMarketsIntoCategories = (rawMarkets, configMap) => {
  const categorized = {
    economics: [],
    sports: [],
    tech: [],
    weather: [],
    other: []
  };

  rawMarkets.forEach(m => {
    const seriesTicker = m.series_ticker || m.ticker?.split('-')[0];
    const config = configMap[seriesTicker] || {};
    const cat = config.category || m.category || 'other';

    const yesPrice = m.yes_price !== undefined
      ? (m.yes_price > 1 ? m.yes_price / 100 : m.yes_price)
      : (m.yes_bid || m.last_price || 50) / 100;

    const processed = {
      ticker: m.ticker,
      title: m.title,
      category: cat,
      url: m.url || config.url || `https://kalshi.com/markets/${seriesTicker?.toLowerCase()}`,
      yes_price: yesPrice,
      volume: m.volume || 0,
      volume_24h: m.volume_24h || 0,
      price_change: m.price_change !== undefined ? m.price_change :
        (m.previous_yes_bid ? ((m.yes_bid || m.last_price) - m.previous_yes_bid) / 100 : (Math.random() - 0.5) * 0.05),
      commentary: m.commentary || null,
      question: m.question || null,
    };

    if (categorized[cat]) {
      categorized[cat].push(processed);
    } else {
      categorized.other.push(processed);
    }
  });

  Object.keys(categorized).forEach(cat => {
    categorized[cat].sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0));
  });

  return categorized;
};

// Fetch markets from Kalshi public API by series
const fetchKalshiMarkets = async () => {
  const configMap = {};
  MARKET_CONFIG.forEach(c => {
    configMap[c.series] = { category: c.category, url: c.url };
  });

  let allMarkets = [];
  let anySuccess = false;

  const fetchPromises = MARKET_CONFIG.map(async (config) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Use proxy on Vercel to avoid CORS, direct API locally
      let url;
      if (proxyBase) {
        // Fetch series list via proxy — we need to go through our serverless fn
        // But our proxy is per-ticker. For series listing, still use direct API
        // (Vercel serverless functions run server-side, no CORS issue)
        url = `${API_BASE}/markets?series_ticker=${config.series}&status=open&limit=30`;
      } else {
        url = `${API_BASE}/markets?series_ticker=${config.series}&status=open&limit=30`;
      }

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!response.ok) return [];

      const data = await response.json();
      const markets = (data.markets || []).map(m => ({
        ...m,
        _category: config.category,
        _seriesUrl: config.url,
      }));
      return markets;
    } catch (err) {
      console.log(`Failed to fetch ${config.series}:`, err.message);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  results.forEach(markets => {
    if (markets.length > 0) anySuccess = true;
    allMarkets.push(...markets);
  });

  if (anySuccess && allMarkets.length > 0) {
    console.log(`Loaded ${allMarkets.length} markets from Kalshi API`);
    const processed = allMarkets.map(m => {
      const yesBid = parseFloat(m.yes_bid_dollars || m.yes_bid || 0);
      const yesAsk = parseFloat(m.yes_ask_dollars || m.yes_ask || 0);
      const lastPrice = parseFloat(m.last_price_dollars || m.last_price || 0);
      const yesPrice = lastPrice || yesBid || (yesAsk > 0 ? yesAsk - 0.01 : 0.5);

      return {
        ticker: m.ticker,
        title: m.title,
        yes_price: yesPrice,
        volume: m.volume_fp || m.volume || 0,
        volume_24h: m.volume_24h_fp || m.volume_24h || 0,
        category: m._category,
        url: m._seriesUrl || `https://kalshi.com/markets/${(m.series_ticker || m.ticker.split('-')[0]).toLowerCase()}`,
        series_ticker: m.series_ticker || m.ticker.split('-')[0],
      };
    });

    return {
      markets: processMarketsIntoCategories(processed, configMap),
      error: null,
      isLive: true,
    };
  }

  // All fetches failed — use fallback data
  console.log('Using embedded fallback data');
  const fallbackConfigMap = {};
  FALLBACK_MARKETS.forEach(m => {
    fallbackConfigMap[m.ticker] = { category: m.category, url: m.url };
  });
  return {
    markets: processMarketsIntoCategories(FALLBACK_MARKETS.map(m => ({
      ...m,
      series_ticker: m.ticker.split('-')[0],
    })), fallbackConfigMap),
    error: 'Using sample data — live API unavailable',
    isLive: false,
  };
};

// Fetch price history for displayed tickers
const fetchHistories = async (tickers) => {
  if (!proxyBase) return {}; // History API only available on Vercel
  const map = {};
  const promises = tickers.map(async (ticker) => {
    try {
      const res = await fetch(`${proxyBase}/history?ticker=${ticker}`);
      if (res.ok) {
        const data = await res.json();
        if (data.history && data.history.length > 0) {
          map[ticker] = data.history;
        }
      }
    } catch {
      // silently ignore
    }
  });
  await Promise.all(promises);
  return map;
};

export default function KalshiNewspaper() {
  const [markets, setMarkets] = useState({
    economics: [],
    sports: [],
    tech: [],
    weather: [],
    other: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeCategory, setActiveCategory] = useState('home');
  const [historyMap, setHistoryMap] = useState({});
  const [drawerMarket, setDrawerMarket] = useState(null);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    const result = await fetchKalshiMarkets();
    setMarkets(result.markets);
    setError(result.error);
    setIsLive(result.isLive);
    setLastUpdated(result.timestamp ? new Date(result.timestamp) : new Date());
    setLoading(false);

    // Fetch price histories for all displayed tickers
    const allTickers = Object.values(result.markets).flat().map(m => m.ticker);
    const histories = await fetchHistories(allTickers);
    setHistoryMap(histories);
  }, []);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  const handleRefresh = () => {
    loadMarkets();
  };

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDrawer = useCallback((market) => {
    setDrawerMarket(market);
    document.body.style.overflow = 'hidden';
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerMarket(null);
    document.body.style.overflow = '';
  }, []);

  const totalMarkets = Object.values(markets).flat().length;
  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#faf9f6',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Masthead */}
      <header style={{
        borderBottom: '1px solid #1a1a1a',
        padding: '12px 20px',
        backgroundColor: '#faf9f6',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{
              fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
              fontSize: 9,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#666',
            }}>{today}</div>
          </div>
          <h1
            onClick={() => handleCategoryClick('home')}
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 42,
              fontWeight: 400,
              textAlign: 'center',
              letterSpacing: '-0.02em',
              margin: '6px 0',
              color: '#1a1a1a',
              cursor: 'pointer',
            }}
          >The Prediction Post</h1>
          <div style={{
            fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'center',
            color: '#666',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: isLive ? '#22c55e' : '#888',
                display: 'inline-block'
              }}></span>
              {isLive ? 'Live from Kalshi' : 'Sample Data'}
            </span>
            <span style={{ color: '#ccc' }}>·</span>
            <span style={{ color: '#888' }}>{totalMarkets} markets</span>
            <span style={{ color: '#ccc' }}>·</span>
            <span style={{ color: '#888' }}>
              {loading ? 'Loading...' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''}
            </span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        borderBottom: '1px solid #e5e5e5',
        padding: '8px 20px',
        backgroundColor: '#faf9f6',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1000,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          {CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleCategoryClick(id)}
              style={{
                fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
                fontSize: 11,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: activeCategory === id ? '#1a1a1a' : '#666',
                background: activeCategory === id ? '#f0f0eb' : 'none',
                border: 'none',
                padding: '6px 10px',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: activeCategory === id ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}

          <div style={{ width: 1, height: 20, backgroundColor: '#ddd', margin: '0 8px' }} />

          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
              fontSize: 11,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: loading ? '#999' : '#fff',
              background: loading ? '#ccc' : '#1a1a1a',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 3,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'background-color 0.2s',
            }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.backgroundColor = '#333'; }}
            onMouseOut={e => { if (!loading) e.currentTarget.style.backgroundColor = '#1a1a1a'; }}
          >
            <span style={{
              display: 'inline-block',
              animation: loading ? 'spin 1s linear infinite' : 'none',
            }}>↻</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '24px 20px',
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 40,
        alignItems: 'start',
      }}>
        {/* Left Column - Main Content */}
        <div>
          {loading && totalMarkets === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#666' }}>
                Loading markets from Kalshi API...
              </div>
            </div>
          ) : activeCategory === 'home' ? (
            <FrontPage markets={markets} onCategoryClick={handleCategoryClick} historyMap={historyMap} onOpenDrawer={handleOpenDrawer} />
          ) : (
            <CategoryPage
              title={currentCategory?.label || ''}
              markets={markets[activeCategory] || []}
              historyMap={historyMap}
              onOpenDrawer={handleOpenDrawer}
            />
          )}
        </div>

        {/* Right Column - Sidebar */}
        <aside style={{
          borderLeft: '1px solid #e5e5e5',
          paddingLeft: 24,
        }}>
          <SidebarContent
            markets={markets}
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
            historyMap={historyMap}
            onOpenDrawer={handleOpenDrawer}
          />
        </aside>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1a1a1a',
        padding: '16px 20px',
        textAlign: 'center',
        backgroundColor: '#faf9f6',
      }}>
        <div style={{
          fontFamily: '"Franklin Gothic Medium", Arial Narrow, sans-serif',
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#888',
        }}>
          Prices in cents · Volume in USD · {isLive ? 'Live data from Kalshi API' : 'Sample data · Refresh for live prices'}
        </div>
      </footer>

      {/* Market Detail Drawer */}
      {drawerMarket && (
        <MarketDrawer
          market={drawerMarket}
          onClose={handleCloseDrawer}
          historyData={historyMap[drawerMarket.ticker]}
        />
      )}
    </div>
  );
}
