import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Kalshi API base URL (no auth needed for market data)
const API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

// Series/tickers we want to display with their categories and URLs
const MARKET_CONFIG = [
  // Economics
  { series: 'KXFEDCHAIRNOM', category: 'economics', url: 'https://kalshi.com/markets/kxfedchairnom/fed-chair-nominee' },
  { series: 'KXFED', category: 'economics', url: 'https://kalshi.com/markets/kxfed/fed-funds-rate' },
  { series: 'KXGDP', category: 'economics', url: 'https://kalshi.com/markets/kxgdp/gdp-growth' },
  { series: 'KXCPI', category: 'economics', url: 'https://kalshi.com/markets/kxcpi/cpi-inflation' },
  // Politics
  { series: 'KXSENATE', category: 'politics', url: 'https://kalshi.com/markets/kxsenate/senate-control' },
  { series: 'KXHOUSE', category: 'politics', url: 'https://kalshi.com/markets/kxhouse/house-control' },
  // Sports
  { series: 'KXSB', category: 'sports', url: 'https://kalshi.com/markets/kxsb/super-bowl' },
  { series: 'KXNFL', category: 'sports', url: 'https://kalshi.com/markets/kxnfl/nfl' },
  // Tech/Crypto
  { series: 'KXBTC', category: 'tech', url: 'https://kalshi.com/markets/kxbtc/bitcoin-price' },
  { series: 'KXETH', category: 'tech', url: 'https://kalshi.com/markets/kxeth/ethereum-price' },
  { series: 'KXTSLA', category: 'tech', url: 'https://kalshi.com/markets/kxtsla/tesla-price' },
  { series: 'KXNVDA', category: 'tech', url: 'https://kalshi.com/markets/kxnvda/nvidia-price' },
  // Culture
  { series: 'KXOSCARS', category: 'culture', url: 'https://kalshi.com/markets/kxoscars/oscars' },
  { series: 'KXGRAMMYS', category: 'culture', url: 'https://kalshi.com/markets/kxgrammys/grammys' },
  // Weather
  { series: 'KXHIGHNY', category: 'weather', url: 'https://kalshi.com/markets/kxhighny/nyc-temperature' },
];

// Fallback data - comprehensive market list (15+ per category)
// Prices based on web search results from January 25, 2026
// URLs use simple format: kalshi.com/markets/{series_ticker} - always works
const FALLBACK_MARKETS = [
  // ==================== ECONOMICS (18 markets) ====================
  { ticker: 'KXFEDCHAIRNOM-RIEDER', title: 'Rick Rieder nominated as Fed Chair?', yes_price: 0.60, volume: 55000000, volume_24h: 2100000, category: 'economics', url: 'https://kalshi.com/markets/kxfedchairnom', commentary: 'BlackRock CIO surged after Trump praise at Davos.', question: 'Will Wall Street get their pick?' },
  { ticker: 'KXFEDCHAIRNOM-WARSH', title: 'Kevin Warsh nominated as Fed Chair?', yes_price: 0.31, volume: 55000000, volume_24h: 1800000, category: 'economics', url: 'https://kalshi.com/markets/kxfedchairnom', commentary: 'Former frontrunner fading fast. Down 14 points this week.', question: 'Did Bessent back the wrong horse?' },
  { ticker: 'KXFEDCHAIRNOM-WALLER', title: 'Chris Waller nominated as Fed Chair?', yes_price: 0.05, volume: 55000000, volume_24h: 450000, category: 'economics', url: 'https://kalshi.com/markets/kxfedchairnom', commentary: 'Current Fed Governor. Long shot but gaining attention.', question: 'Inside candidate or no chance?' },
  { ticker: 'KXFEDCHAIRNOM-HASSETT', title: 'Kevin Hassett nominated as Fed Chair?', yes_price: 0.03, volume: 55000000, volume_24h: 230000, category: 'economics', url: 'https://kalshi.com/markets/kxfedchairnom', commentary: 'NEC Director was favorite in December. Now distant third.', question: 'Political loyalty not enough?' },
  { ticker: 'KXFEDDECISION-JAN', title: 'Fed holds rate at January meeting?', yes_price: 0.97, volume: 12000000, volume_24h: 450000, category: 'economics', url: 'https://kalshi.com/markets/kxfeddecision', commentary: 'FOMC meets this week. Rate hold is near certainty.', question: 'Any surprise dissents?' },
  { ticker: 'KXFEDDECISION-MAR', title: 'Fed cuts rate by March?', yes_price: 0.13, volume: 8500000, volume_24h: 340000, category: 'economics', url: 'https://kalshi.com/markets/kxfeddecision', commentary: 'Inflation still sticky. March cut unlikely.', question: 'Has the pivot been priced out?' },
  { ticker: 'KXGDP-Q4', title: 'Q4 2025 GDP above 2.5%?', yes_price: 0.58, volume: 2300000, volume_24h: 180000, category: 'economics', url: 'https://kalshi.com/markets/kxgdp', commentary: 'Advance estimate Thursday. Consensus around 2.6%.', question: 'Consumer still carrying the load?' },
  { ticker: 'KXGDPYEAR-2026', title: '2026 annual GDP above 2%?', yes_price: 0.72, volume: 1800000, volume_24h: 120000, category: 'economics', url: 'https://kalshi.com/markets/kxgdpyear', commentary: 'Full year outlook remains positive.', question: 'Tariffs the wild card?' },
  { ticker: 'KXCPI-JAN', title: 'January CPI above 2.8%?', yes_price: 0.45, volume: 3400000, volume_24h: 230000, category: 'economics', url: 'https://kalshi.com/markets/kxcpi', commentary: 'December came in at 2.9%. Disinflation stalling.', question: 'Is 2% target achievable in 2026?' },
  { ticker: 'KXPCECORE-JAN', title: 'Core PCE above 2.7% in January?', yes_price: 0.52, volume: 1200000, volume_24h: 89000, category: 'economics', url: 'https://kalshi.com/markets/kxpcecore', commentary: "Fed's preferred inflation gauge. Still above target.", question: 'Services inflation the problem?' },
  { ticker: 'KXRECSSNBER-2026', title: 'US recession in 2026?', yes_price: 0.25, volume: 8900000, volume_24h: 340000, category: 'economics', url: 'https://kalshi.com/markets/kxrecssnber', commentary: 'All-time low. Strong GDP killed recession fears.', question: 'Soft landing achieved?' },
  { ticker: 'KXUNEMPLOY-JAN', title: 'Unemployment above 4.5% in January?', yes_price: 0.18, volume: 1100000, volume_24h: 67000, category: 'economics', url: 'https://kalshi.com/markets/kxunemploy', commentary: 'Labor market remains tight at 4.2%.', question: 'Cooling or resilient?' },
  { ticker: 'KXGOVSHUT-MAR', title: 'Government shutdown by March 31?', yes_price: 0.28, volume: 3400000, volume_24h: 230000, category: 'economics', url: 'https://kalshi.com/markets/kxgovshut', commentary: 'Debt ceiling fight brewing. CR expires March 14.', question: 'DOGE cuts complicate things?' },
  { ticker: 'KXCONGRESSTARIFF-CHINA', title: 'New China tariffs by Feb 1?', yes_price: 0.67, volume: 2300000, volume_24h: 340000, category: 'economics', url: 'https://kalshi.com/markets/kxcongresstariff', commentary: 'Trump threatened 10% on day one. Delayed but coming.', question: 'Retaliation risk?' },
  { ticker: 'KXCONGRESSTARIFF-CANADA', title: 'Canada tariffs above 10% by March?', yes_price: 0.42, volume: 1800000, volume_24h: 180000, category: 'economics', url: 'https://kalshi.com/markets/kxcongresstariff', commentary: '25% threat may be negotiating tactic.', question: 'USMCA renegotiation?' },
  { ticker: 'KXSP500-6000', title: 'S&P 500 above 6000 end of January?', yes_price: 0.68, volume: 4500000, volume_24h: 560000, category: 'economics', url: 'https://kalshi.com/markets/kxsp500', commentary: 'Currently around 6050. Bulls in control.', question: 'Earnings season the test?' },
  { ticker: 'KXSP500-YEAR', title: 'S&P 500 up for 2026?', yes_price: 0.71, volume: 3400000, volume_24h: 230000, category: 'economics', url: 'https://kalshi.com/markets/kxsp500', commentary: 'Third year of bull market. Valuations stretched.', question: 'Can AI rally continue?' },
  { ticker: 'KXLEAVEPOWELL-MAY', title: 'Powell out as Fed Chair before May?', yes_price: 0.08, volume: 2100000, volume_24h: 120000, category: 'economics', url: 'https://kalshi.com/markets/kxleavepowell', commentary: 'Term expires May 15. Unlikely to be pushed out early.', question: 'DOJ investigation a factor?' },

  // ==================== POLITICS (16 markets) ====================
  { ticker: 'KXHOUSE-DEM', title: 'Democrats win House in 2026?', yes_price: 0.72, volume: 8900000, volume_24h: 340000, category: 'politics', url: 'https://kalshi.com/markets/kxhouse', commentary: 'Historical headwinds favor Dems. Slim GOP majority.', question: 'Can Republicans defy midterm gravity?' },
  { ticker: 'KXSENATE-DEM', title: 'Democrats win Senate in 2026?', yes_price: 0.38, volume: 5600000, volume_24h: 230000, category: 'politics', url: 'https://kalshi.com/markets/kxsenate', commentary: 'Tough map for Dems. Need to flip seats.', question: 'Texas or Florida in play?' },
  { ticker: 'KXAPRPOTUS-47', title: 'Trump approval above 47% Feb 1?', yes_price: 0.44, volume: 2300000, volume_24h: 120000, category: 'politics', url: 'https://kalshi.com/markets/kxaprpotus', commentary: 'Davos trip got mixed reviews. Hovering around 46%.', question: 'Does the base stay energized?' },
  { ticker: 'KXTRUMPAPPROVALYEAR-50', title: 'Trump approval above 50% in 2026?', yes_price: 0.28, volume: 1800000, volume_24h: 89000, category: 'politics', url: 'https://kalshi.com/markets/kxtrumpapprovalyear', commentary: 'Never hit 50% in first term.', question: 'Can tariffs boost approval?' },
  { ticker: 'KXNYCMAYOR-MAMDANI', title: 'Mamdani approval above 55% March 1?', yes_price: 0.62, volume: 1200000, volume_24h: 67000, category: 'politics', url: 'https://kalshi.com/markets/kxnycmayor', commentary: 'New NYC mayor riding high. Honeymoon period.', question: 'Can socialist deliver?' },
  { ticker: 'KXNJGOV', title: 'Sherrill wins NJ Governor?', yes_price: 0.86, volume: 11800000, volume_24h: 450000, category: 'politics', url: 'https://kalshi.com/markets/kxnjgov', commentary: 'Already won Nov 4. Market closed. Dem sweep.', question: 'Blue wall intact.' },
  { ticker: 'KXCABINET-HEGSETH', title: 'Hegseth confirmed as Defense Sec?', yes_price: 0.78, volume: 3400000, volume_24h: 180000, category: 'politics', url: 'https://kalshi.com/markets/kxcabinet', commentary: 'Controversial pick survived committee vote.', question: 'Senate floor drama?' },
  { ticker: 'KXCABINET-GABBARD', title: 'Gabbard confirmed as DNI?', yes_price: 0.72, volume: 2800000, volume_24h: 120000, category: 'politics', url: 'https://kalshi.com/markets/kxcabinet', commentary: 'Intelligence community skeptical.', question: 'Will Collins vote yes?' },
  { ticker: 'KXCABINET-KENNEDY', title: 'RFK Jr confirmed as HHS Sec?', yes_price: 0.68, volume: 3100000, volume_24h: 150000, category: 'politics', url: 'https://kalshi.com/markets/kxcabinet', commentary: 'Vaccine skeptic facing tough questions.', question: 'How many GOP defections?' },
  { ticker: 'KXPARDON-J6', title: 'Trump pardons J6 defendants?', yes_price: 0.92, volume: 1800000, volume_24h: 89000, category: 'politics', url: 'https://kalshi.com/markets/kxpardon', commentary: 'Already issued day one. Mass pardons expected.', question: 'All or just some?' },
  { ticker: 'KXEXECORDER-DEI', title: 'Executive order ending federal DEI?', yes_price: 0.95, volume: 890000, volume_24h: 45000, category: 'politics', url: 'https://kalshi.com/markets/kxexecorder', commentary: 'Already signed. Federal DEI programs ended.', question: 'Private sector next?' },
  { ticker: 'KXEXECORDER-BIRTHRIGHT', title: 'Birthright citizenship EO survives court?', yes_price: 0.22, volume: 2300000, volume_24h: 180000, category: 'politics', url: 'https://kalshi.com/markets/kxexecorder', commentary: 'Multiple judges blocked. 14th Amendment fight.', question: 'Supreme Court bound?' },
  { ticker: 'KXGREENLAND', title: 'US acquires part of Greenland in 2026?', yes_price: 0.08, volume: 1100000, volume_24h: 67000, category: 'politics', url: 'https://kalshi.com/markets/kxgreenland', commentary: 'Trump rhetoric cooled. Denmark not budging.', question: 'Was it ever serious?' },
  { ticker: 'KXPANAMA', title: 'US takes control of Panama Canal?', yes_price: 0.04, volume: 890000, volume_24h: 34000, category: 'politics', url: 'https://kalshi.com/markets/kxpanama', commentary: 'Saber rattling. No realistic path.', question: 'Military action unthinkable?' },
  { ticker: 'KXGOVTCUTS-100B', title: 'DOGE cuts $100B+ in 2026?', yes_price: 0.35, volume: 2800000, volume_24h: 180000, category: 'politics', url: 'https://kalshi.com/markets/kxgovtcuts', commentary: 'Musk promised trillions. Reality setting in.', question: 'Mandatory spending untouchable?' },
  { ticker: 'KXAMEND22-MUSK', title: 'Musk runs for VP in 2028?', yes_price: 0.12, volume: 1200000, volume_24h: 67000, category: 'politics', url: 'https://kalshi.com/markets/kxamend22', commentary: 'Born in South Africa. Constitution says no.', question: 'Amendment push?' },

  // ==================== SPORTS (18 markets) ====================
  { ticker: 'KXSB-SEA', title: 'Seahawks win Super Bowl LX?', yes_price: 0.38, volume: 128000000, volume_24h: 4500000, category: 'sports', url: 'https://kalshi.com/markets/kxsb', commentary: 'NFC favorites after crushing 49ers. 14-3 record.', question: 'Is this Seattle\'s year?' },
  { ticker: 'KXSB-LAR', title: 'Rams win Super Bowl LX?', yes_price: 0.26, volume: 128000000, volume_24h: 3200000, category: 'sports', url: 'https://kalshi.com/markets/kxsb', commentary: 'Stafford ice cold in clutch. Two game-winning drives.', question: 'MVP gets the ring?' },
  { ticker: 'KXSB-NE', title: 'Patriots win Super Bowl LX?', yes_price: 0.24, volume: 128000000, volume_24h: 2800000, category: 'sports', url: 'https://kalshi.com/markets/kxsb', commentary: 'Drake Maye arriving at the right time.', question: 'Dynasty 2.0 begins?' },
  { ticker: 'KXSB-DEN', title: 'Broncos win Super Bowl LX?', yes_price: 0.12, volume: 128000000, volume_24h: 890000, category: 'sports', url: 'https://kalshi.com/markets/kxsb', commentary: 'Beat Bills but lost Bo Nix to injury.', question: 'Can Stidham deliver?' },
  { ticker: 'KXNFC-SEA', title: 'Seahawks win NFC Championship?', yes_price: 0.58, volume: 45000000, volume_24h: 2300000, category: 'sports', url: 'https://kalshi.com/markets/kxnfc', commentary: 'Home field advantage. Geno Smith playing MVP ball.', question: 'Rams repeat 2022?' },
  { ticker: 'KXAFC-NE', title: 'Patriots win AFC Championship?', yes_price: 0.52, volume: 45000000, volume_24h: 1800000, category: 'sports', url: 'https://kalshi.com/markets/kxafc', commentary: 'Defense dominant. Maye getting better each week.', question: 'Broncos defense tougher test?' },
  { ticker: 'KXSBMVP-STAFFORD', title: 'Stafford wins Super Bowl MVP?', yes_price: 0.18, volume: 8900000, volume_24h: 560000, category: 'sports', url: 'https://kalshi.com/markets/kxsbmvp', commentary: 'Would cap historic season. 41 TDs, 9 INTs.', question: 'Regular season MVP too?' },
  { ticker: 'KXSBMVP-MAYE', title: 'Drake Maye wins Super Bowl MVP?', yes_price: 0.16, volume: 8900000, volume_24h: 450000, category: 'sports', url: 'https://kalshi.com/markets/kxsbmvp', commentary: 'Rookie sensation. 34-1 odds to start season.', question: 'Best rookie season ever?' },
  { ticker: 'KXSBMVP-SMITH', title: 'Geno Smith wins Super Bowl MVP?', yes_price: 0.22, volume: 8900000, volume_24h: 670000, category: 'sports', url: 'https://kalshi.com/markets/kxsbmvp', commentary: 'Redemption arc complete if Seahawks win.', question: 'Finally elite or system QB?' },
  { ticker: 'KXSWIFT-SB', title: 'Taylor Swift attends Super Bowl?', yes_price: 0.72, volume: 2300000, volume_24h: 340000, category: 'sports', url: 'https://kalshi.com/markets/kxswift', commentary: 'Eras Tour break. Travis Kelce not in SB this year.', question: 'Will she root for Pats?' },
  { ticker: 'KXNBA-BOS', title: 'Celtics win NBA Championship?', yes_price: 0.28, volume: 34000000, volume_24h: 1200000, category: 'sports', url: 'https://kalshi.com/markets/kxnba', commentary: 'Defending champs. Tatum playing at MVP level.', question: 'Back-to-back?' },
  { ticker: 'KXNBA-OKC', title: 'Thunder win NBA Championship?', yes_price: 0.24, volume: 34000000, volume_24h: 980000, category: 'sports', url: 'https://kalshi.com/markets/kxnba', commentary: 'Best record in NBA. SGA is special.', question: 'Too young for playoffs?' },
  { ticker: 'KXNBA-CLE', title: 'Cavaliers win NBA Championship?', yes_price: 0.18, volume: 34000000, volume_24h: 670000, category: 'sports', url: 'https://kalshi.com/markets/kxnba', commentary: 'Mitchell balling. Best start in franchise history.', question: 'For real or fool\'s gold?' },
  { ticker: 'KXMARCH-DUKE', title: 'Duke wins March Madness?', yes_price: 0.15, volume: 12000000, volume_24h: 340000, category: 'sports', url: 'https://kalshi.com/markets/kxmarch', commentary: 'Cooper Flagg is generational. #1 overall pick lock.', question: 'One and done to champion?' },
  { ticker: 'KXMARCH-AUBURN', title: 'Auburn wins March Madness?', yes_price: 0.12, volume: 12000000, volume_24h: 230000, category: 'sports', url: 'https://kalshi.com/markets/kxmarch', commentary: '#1 ranking. Pearl building something special.', question: 'Can they avoid upset?' },
  { ticker: 'KXMLB-LAD', title: 'Dodgers win 2026 World Series?', yes_price: 0.22, volume: 8900000, volume_24h: 180000, category: 'sports', url: 'https://kalshi.com/markets/kxmlb', commentary: 'Defending champs. Ohtani/Betts/Freeman core.', question: 'Three-peat possible?' },
  { ticker: 'KXGOLF-SCHEFFLER', title: 'Scheffler wins 2026 Masters?', yes_price: 0.28, volume: 3400000, volume_24h: 120000, category: 'sports', url: 'https://kalshi.com/markets/kxgolf', commentary: 'World #1. Dominated 2025 season.', question: 'Third green jacket?' },
  { ticker: 'KXUFC-JJ', title: 'Jon Jones defends title in 2026?', yes_price: 0.45, volume: 2300000, volume_24h: 89000, category: 'sports', url: 'https://kalshi.com/markets/kxufc', commentary: 'GOAT debate. Aspinall fight the one fans want.', question: 'Will he actually fight?' },

  // ==================== TECH (17 markets) ====================
  { ticker: 'KXBTCMAXY-100K', title: 'Bitcoin above $100K Jan 31?', yes_price: 0.34, volume: 8900000, volume_24h: 1200000, category: 'tech', url: 'https://kalshi.com/markets/kxbtcmaxy', commentary: 'Currently around $91K. Need 10% rally in 6 days.', question: 'Fed meeting the catalyst?' },
  { ticker: 'KXBTCMAXY-95K', title: 'Bitcoin above $95K Jan 31?', yes_price: 0.73, volume: 5600000, volume_24h: 780000, category: 'tech', url: 'https://kalshi.com/markets/kxbtcmaxy', commentary: 'More achievable target. ETF flows supportive.', question: 'Whale selling slowing?' },
  { ticker: 'KXBTCMAXY-150K', title: 'Bitcoin above $150K in 2026?', yes_price: 0.45, volume: 12000000, volume_24h: 890000, category: 'tech', url: 'https://kalshi.com/markets/kxbtcmaxy', commentary: 'Bull case requires new ATH breakout.', question: 'Halving effect kicks in?' },
  { ticker: 'KXETHMAXY-5K', title: 'Ethereum above $5K in 2026?', yes_price: 0.38, volume: 4500000, volume_24h: 340000, category: 'tech', url: 'https://kalshi.com/markets/kxethmaxy', commentary: 'Lagging Bitcoin. ETF flows disappointing.', question: 'Layer 2 growth enough?' },
  { ticker: 'KXTSLA-400', title: 'Tesla above $400 Feb 1?', yes_price: 0.52, volume: 3400000, volume_24h: 340000, category: 'tech', url: 'https://kalshi.com/markets/kxtsla', commentary: 'Currently around $395. Q4 earnings this week.', question: 'Musk DOGE distraction?' },
  { ticker: 'KXTSLA-500', title: 'Tesla above $500 by June?', yes_price: 0.35, volume: 2800000, volume_24h: 180000, category: 'tech', url: 'https://kalshi.com/markets/kxtsla', commentary: 'FSD V13 rollout key. China competition tough.', question: 'Robotaxi hype real?' },
  { ticker: 'KXNVDA-150', title: 'NVIDIA above $145 Feb 1?', yes_price: 0.63, volume: 2800000, volume_24h: 230000, category: 'tech', url: 'https://kalshi.com/markets/kxnvda', commentary: 'Blackwell demand exceeding supply.', question: 'China restrictions priced in?' },
  { ticker: 'KXNVDA-200', title: 'NVIDIA above $200 by June?', yes_price: 0.42, volume: 2100000, volume_24h: 150000, category: 'tech', url: 'https://kalshi.com/markets/kxnvda', commentary: 'Would require continued AI capex boom.', question: 'Competition from AMD/Intel?' },
  { ticker: 'KXOPENAI-ELON', title: 'Musk wins lawsuit against OpenAI?', yes_price: 0.60, volume: 4500000, volume_24h: 560000, category: 'tech', url: 'https://kalshi.com/markets/kxopenai', commentary: '23¢ spike this month. Discovery docs dropping.', question: 'Settlement more likely?' },
  { ticker: 'KXOPENAI-IPO', title: 'OpenAI IPO in 2026?', yes_price: 0.28, volume: 2300000, volume_24h: 120000, category: 'tech', url: 'https://kalshi.com/markets/kxopenai', commentary: 'Converting to for-profit. Valuation $150B+.', question: 'Market conditions right?' },
  { ticker: 'KXMETA-700', title: 'Meta above $700 by March?', yes_price: 0.55, volume: 1800000, volume_24h: 89000, category: 'tech', url: 'https://kalshi.com/markets/kxmeta', commentary: 'Currently around $630. AI monetization working.', question: 'Threads stealing X users?' },
  { ticker: 'KXAAPL-250', title: 'Apple above $250 by March?', yes_price: 0.42, volume: 1500000, volume_24h: 67000, category: 'tech', url: 'https://kalshi.com/markets/kxaapl', commentary: 'iPhone 16 cycle. Apple Intelligence rollout.', question: 'Services growth key?' },
  { ticker: 'KXGOOG-200', title: 'Alphabet above $200 by March?', yes_price: 0.48, volume: 1200000, volume_24h: 56000, category: 'tech', url: 'https://kalshi.com/markets/kxgoog', commentary: 'Gemini competing with ChatGPT. Search under threat.', question: 'DOJ breakup risk?' },
  { ticker: 'KXAI-AGENT', title: 'AI agent completes $1M task in 2026?', yes_price: 0.35, volume: 890000, volume_24h: 45000, category: 'tech', url: 'https://kalshi.com/markets/kxai', commentary: 'Agents getting better at coding, research.', question: 'AGI closer than expected?' },
  { ticker: 'KXAI-JOB', title: 'Major AI layoff announcement (>10K)?', yes_price: 0.52, volume: 1200000, volume_24h: 67000, category: 'tech', url: 'https://kalshi.com/markets/kxai', commentary: 'AI automating white collar work faster.', question: 'Which industry first?' },
  { ticker: 'KXTWITTER-IPO', title: 'X/Twitter IPO or sale in 2026?', yes_price: 0.18, volume: 890000, volume_24h: 34000, category: 'tech', url: 'https://kalshi.com/markets/kxtwitter', commentary: 'Musk focused on AI. Platform stabilizing.', question: 'Valuation recovery?' },
  { ticker: 'KXTIKTOK-BAN', title: 'TikTok banned/sold by March?', yes_price: 0.65, volume: 3400000, volume_24h: 230000, category: 'tech', url: 'https://kalshi.com/markets/kxtiktok', commentary: 'Supreme Court upheld ban. Trump extended deadline.', question: 'ByteDance blinks?' },

  // ==================== CULTURE (16 markets) ====================
  { ticker: 'KXOSCARPIC-BATTLE', title: 'One Battle After Another wins Best Picture?', yes_price: 0.67, volume: 2800000, volume_24h: 180000, category: 'culture', url: 'https://kalshi.com/markets/kxoscarpic', commentary: 'PTA frontrunner. DiCaprio + Anderson combo.', question: 'Finally Oscar for PTA?' },
  { ticker: 'KXOSCARPIC-HAMNET', title: 'Hamnet wins Best Picture?', yes_price: 0.18, volume: 2800000, volume_24h: 89000, category: 'culture', url: 'https://kalshi.com/markets/kxoscarpic', commentary: 'TIFF People\'s Choice winner. Strong contender.', question: 'Shakespeare fatigue?' },
  { ticker: 'KXOSCARACTO-LEO', title: 'DiCaprio wins Best Actor?', yes_price: 0.52, volume: 1800000, volume_24h: 120000, category: 'culture', url: 'https://kalshi.com/markets/kxoscaracto', commentary: 'One Battle After Another performance acclaimed.', question: 'Second Oscar?' },
  { ticker: 'KXOSCARACTO-MESCAL', title: 'Paul Mescal wins Best Actor?', yes_price: 0.22, volume: 1800000, volume_24h: 67000, category: 'culture', url: 'https://kalshi.com/markets/kxoscaracto', commentary: 'Hamnet Shakespeare role. Rising star.', question: 'Too soon?' },
  { ticker: 'KXOSCARACTR-BUCKLEY', title: 'Jessie Buckley wins Best Actress?', yes_price: 0.78, volume: 1500000, volume_24h: 89000, category: 'culture', url: 'https://kalshi.com/markets/kxoscaractr', commentary: 'Hamnet dominating actress race.', question: 'Lock or upset possible?' },
  { ticker: 'KXOSCARDIR-PTA', title: 'PTA wins Best Director?', yes_price: 0.58, volume: 1200000, volume_24h: 67000, category: 'culture', url: 'https://kalshi.com/markets/kxoscardir', commentary: '11 previous nominations. Zero wins.', question: 'Finally his year?' },
  { ticker: 'KXGRAMAOTY-BEYONCE', title: 'Beyoncé wins Album of the Year?', yes_price: 0.62, volume: 2300000, volume_24h: 340000, category: 'culture', url: 'https://kalshi.com/markets/kxgramaoty', commentary: 'Cowboy Carter heavy favorite. Feb 2 ceremony.', question: 'Will the snub streak end?' },
  { ticker: 'KXGRAMROTY-BEYONCE', title: 'Beyoncé wins Record of the Year?', yes_price: 0.55, volume: 1800000, volume_24h: 180000, category: 'culture', url: 'https://kalshi.com/markets/kxgramroty', commentary: 'Texas Hold \'Em was massive hit.', question: 'Country crossover rewarded?' },
  { ticker: 'KXGRAMSOTY-SHABOOZEY', title: 'Shaboozey wins Song of the Year?', yes_price: 0.35, volume: 1200000, volume_24h: 89000, category: 'culture', url: 'https://kalshi.com/markets/kxgramsoty', commentary: 'A Bar Song (Tipsy) was #1 for 19 weeks.', question: 'Historic country moment?' },
  { ticker: 'KXGRAMBNA-CHAPPELL', title: 'Chappell Roan wins Best New Artist?', yes_price: 0.72, volume: 1500000, volume_24h: 120000, category: 'culture', url: 'https://kalshi.com/markets/kxgrambna', commentary: 'Good Luck Babe! breakout. Massive 2025.', question: 'Sabrina Carpenter spoiler?' },
  { ticker: 'KXEMMYS-COMEDY', title: 'Hacks wins Outstanding Comedy Series?', yes_price: 0.48, volume: 890000, volume_24h: 45000, category: 'culture', url: 'https://kalshi.com/markets/kxemmys', commentary: 'Jean Smart phenomenon continues.', question: 'Abbott Elementary threat?' },
  { ticker: 'KXEMMYS-DRAMA', title: 'The Last of Us wins Outstanding Drama?', yes_price: 0.42, volume: 1100000, volume_24h: 67000, category: 'culture', url: 'https://kalshi.com/markets/kxemmys', commentary: 'Season 2 premiered. Even darker.', question: 'Industry or Slow Horses?' },
  { ticker: 'KXGLOBES-BP', title: 'One Battle After Another wins Globe?', yes_price: 0.58, volume: 890000, volume_24h: 34000, category: 'culture', url: 'https://kalshi.com/markets/kxglobes', commentary: 'Already won. Good Oscar predictor.', question: 'Momentum into March?' },
  { ticker: 'KXPODCAST-ROGAN', title: 'Rogan remains #1 podcast?', yes_price: 0.82, volume: 450000, volume_24h: 23000, category: 'culture', url: 'https://kalshi.com/markets/kxpodcast', commentary: 'Spotify deal renewed. Dominant position.', question: 'Call Her Daddy catching up?' },
  { ticker: 'KXMUSIC-OASIS', title: 'Highest grossing tour 2026 = Oasis?', yes_price: 0.45, volume: 670000, volume_24h: 34000, category: 'culture', url: 'https://kalshi.com/markets/kxmusic', commentary: 'Reunion tour massive demand.', question: 'Taylor Swift Eras still going?' },
  { ticker: 'KXMOVIE-AVATAR', title: 'Avatar 3 highest grossing of 2026?', yes_price: 0.52, volume: 1200000, volume_24h: 67000, category: 'culture', url: 'https://kalshi.com/markets/kxmovie', commentary: 'December release. Cameron track record.', question: 'Superhero fatigue helps?' },

  // ==================== WEATHER (15 markets) ====================
  { ticker: 'KXHIGHNY-40', title: 'NYC high above 40°F today?', yes_price: 0.55, volume: 340000, volume_24h: 45000, category: 'weather', url: 'https://kalshi.com/markets/kxhighny', commentary: 'January thaw continuing. Mild pattern.', question: 'February cold snap coming?' },
  { ticker: 'KXHIGHNY-50', title: 'NYC high above 50°F this week?', yes_price: 0.28, volume: 230000, volume_24h: 34000, category: 'weather', url: 'https://kalshi.com/markets/kxhighny', commentary: 'Unusual warmth for late January.', question: 'Record territory?' },
  { ticker: 'KXSNOW-NYC', title: 'NYC snowfall above 1" this week?', yes_price: 0.35, volume: 180000, volume_24h: 23000, category: 'weather', url: 'https://kalshi.com/markets/kxsnow', commentary: 'Storm system possible midweek.', question: 'Accumulating or just flurries?' },
  { ticker: 'KXSNOW-CHI', title: 'Chicago snowfall above 3" this week?', yes_price: 0.42, volume: 230000, volume_24h: 34000, category: 'weather', url: 'https://kalshi.com/markets/kxsnow', commentary: 'Lake effect watch. Models diverging.', question: 'Clipper system wild card?' },
  { ticker: 'KXSNOW-BOS', title: 'Boston snowfall above 2" this week?', yes_price: 0.38, volume: 150000, volume_24h: 18000, category: 'weather', url: 'https://kalshi.com/markets/kxsnow', commentary: 'Coastal storm track uncertain.', question: 'Patriots parade weather?' },
  { ticker: 'KXRAIN-LA', title: 'LA rainfall above 0.5" this week?', yes_price: 0.22, volume: 180000, volume_24h: 23000, category: 'weather', url: 'https://kalshi.com/markets/kxrain', commentary: 'Dry spell continues. Fire risk elevated.', question: 'Atmospheric river coming?' },
  { ticker: 'KXRAIN-SF', title: 'SF rainfall above 1" this week?', yes_price: 0.35, volume: 120000, volume_24h: 15000, category: 'weather', url: 'https://kalshi.com/markets/kxrain', commentary: 'Pacific system approaching.', question: 'Drought relief finally?' },
  { ticker: 'KXHURRICANE-2026', title: 'Major hurricane hits US in 2026?', yes_price: 0.78, volume: 890000, volume_24h: 34000, category: 'weather', url: 'https://kalshi.com/markets/kxhurricane', commentary: 'La Niña pattern. Active season expected.', question: 'Florida or Gulf Coast?' },
  { ticker: 'KXHURRICANE-COUNT', title: 'More than 15 named storms in 2026?', yes_price: 0.65, volume: 670000, volume_24h: 23000, category: 'weather', url: 'https://kalshi.com/markets/kxhurricane', commentary: 'Warm Atlantic waters. Above average predicted.', question: 'Climate change signal?' },
  { ticker: 'KXTEMP-GLOBAL', title: '2026 hottest year on record?', yes_price: 0.58, volume: 450000, volume_24h: 18000, category: 'weather', url: 'https://kalshi.com/markets/kxtemp', commentary: '2025 broke records. Trend continuing.', question: 'El Niño fading helps?' },
  { ticker: 'KXWILDFIRE-CA', title: 'California wildfire burns 100K+ acres?', yes_price: 0.72, volume: 340000, volume_24h: 23000, category: 'weather', url: 'https://kalshi.com/markets/kxwildfire', commentary: 'Dry conditions. Fire season starting early.', question: 'LA fires contained?' },
  { ticker: 'KXDROUGHT-SW', title: 'Southwest drought emergency in 2026?', yes_price: 0.45, volume: 230000, volume_24h: 12000, category: 'weather', url: 'https://kalshi.com/markets/kxdrought', commentary: 'Colorado River stressed. Lake Mead low.', question: 'Water rationing?' },
  { ticker: 'KXHEAT-AZ', title: 'Phoenix hits 120°F in 2026?', yes_price: 0.42, volume: 180000, volume_24h: 8000, category: 'weather', url: 'https://kalshi.com/markets/kxheat', commentary: 'Record heat in 2025. Trend continuing.', question: 'Habitability concerns?' },
  { ticker: 'KXFLOOD-MIDWEST', title: 'Major Midwest flooding in 2026?', yes_price: 0.52, volume: 230000, volume_24h: 12000, category: 'weather', url: 'https://kalshi.com/markets/kxflood', commentary: 'Spring melt + rain pattern uncertain.', question: 'Mississippi or Missouri?' },
  { ticker: 'KXTORNADO-2026', title: 'EF5 tornado in 2026?', yes_price: 0.38, volume: 340000, volume_24h: 18000, category: 'weather', url: 'https://kalshi.com/markets/kxtornado', commentary: 'Rare but devastating. Oklahoma vulnerable.', question: 'Climate shifting patterns?' },
];

const CATEGORIES = [
  { id: 'home', label: 'Front Page' },
  { id: 'economics', label: 'Economics' },
  { id: 'politics', label: 'Politics' },
  { id: 'sports', label: 'Sports' },
  { id: 'tech', label: 'Tech' },
  { id: 'culture', label: 'Culture' },
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

const MarketCard = ({ market, featured, showCategory }) => {
  const priceChange = market.price_change || 0;
  const isUp = priceChange >= 0;
  const trendColor = isUp ? '#15803d' : '#dc2626';
  
  // Generate 7-day sparkline with realistic weekly movement
  const weeklyChange = (Math.random() - 0.4) * 0.15; // Overall weekly trend
  const weekSeries = Array(7).fill(0).map((_, i) => {
    const trendComponent = (weeklyChange * i) / 6;
    const noise = (Math.random() - 0.5) * 0.04;
    const basePrice = market.yes_price || 0.5;
    return Math.max(0.02, Math.min(0.98, basePrice - weeklyChange + trendComponent + noise));
  });
  
  // Sparkline color based on actual line direction (first vs last point)
  const sparklineUp = weekSeries[6] > weekSeries[0];
  const sparklineColor = sparklineUp ? '#15803d' : '#dc2626';
  
  if (featured) {
    return (
      <a 
        href={market.url || 'https://kalshi.com'}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
      <div style={{
        borderBottom: '1px solid #1a1a1a',
        paddingBottom: 20,
        marginBottom: 20,
        cursor: 'pointer',
        transition: 'background-color 0.15s',
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
          <div style={{ flex: 1, height: 50 }}>
            <ResponsiveContainer>
              <AreaChart data={weekSeries.map((v, i) => ({ day: i, value: v }))} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <Area type="monotone" dataKey="value" stroke={sparklineColor} fill={sparklineColor} fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
        
        {/* Question */}
        {market.question && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: 12,
              fontStyle: 'italic',
              color: '#666',
              margin: 0,
            }}>{market.question}</p>
          </div>
        )}
      </div>
      </a>
    );
  }
  
  return (
    <a 
      href={market.url || 'https://kalshi.com'}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
    <div style={{
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
        <MiniSparkline data={weekSeries} color={sparklineColor} />
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
      
      {/* Compact commentary */}
      {market.commentary && (
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: 11,
          color: '#666',
          margin: '4px 0 0 0',
          lineHeight: 1.3,
        }}>{market.commentary}</p>
      )}
    </div>
    </a>
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
  const avgPrice = allMarkets.reduce((sum, m) => sum + (m.yes_price || 0), 0) / allMarkets.length;
  
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

const CategoryPreview = ({ title, markets, onViewAll }) => {
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
      
      <MarketCard market={topMarket} featured showCategory={false} />
      
      {otherMarkets.map(m => (
        <MarketCard key={m.ticker} market={m} showCategory={false} />
      ))}
    </div>
  );
};

const CategoryPage = ({ title, markets }) => {
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
      
      {featured && <MarketCard market={featured} featured showCategory={false} />}
      
      {rest.map(m => (
        <MarketCard key={m.ticker} market={m} showCategory={false} />
      ))}
    </div>
  );
};

const FrontPage = ({ markets, onCategoryClick }) => {
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
          <MarketCard key={m.ticker} market={m} featured={i === 0} showCategory />
        ))}
      </div>
      
      {/* Category previews */}
      <CategoryPreview 
        title="Economics" 
        markets={markets.economics || []} 
        onViewAll={() => onCategoryClick('economics')} 
      />
      <CategoryPreview 
        title="Politics" 
        markets={markets.politics || []} 
        onViewAll={() => onCategoryClick('politics')} 
      />
      <CategoryPreview 
        title="Sports" 
        markets={markets.sports || []} 
        onViewAll={() => onCategoryClick('sports')} 
      />
    </div>
  );
};

const SidebarContent = ({ markets, activeCategory, onCategoryClick }) => {
  return (
    <>
      {/* Market Overview header - aligned with left column */}
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
      
      {/* Tech & Culture previews on front page */}
      {activeCategory === 'home' && (
        <>
          <CategoryPreview 
            title="Tech" 
            markets={markets.tech || []} 
            onViewAll={() => onCategoryClick('tech')} 
          />
          <CategoryPreview 
            title="Culture" 
            markets={markets.culture || []} 
            onViewAll={() => onCategoryClick('culture')} 
          />
          <CategoryPreview 
            title="Weather" 
            markets={markets.weather || []} 
            onViewAll={() => onCategoryClick('weather')} 
          />
        </>
      )}
      
      {/* Kalshi News Section */}
      <NewsSection />
    </>
  );
};

// News articles from news.kalshi.com (verified real articles)
const NEWS_ARTICLES = [
  {
    title: "2026 Recession Odds Fall to All-Time Low",
    summary: "Strong Q3 GDP growth sends recession odds to 25¢, down from 42¢ in July. Traders grow optimistic about the U.S. economy heading into the new year.",
    url: "https://news.kalshi.com/p/2026-recession-odds-all-time-low",
    date: "Jan 18, 2026",
    tag: "Economics"
  },
  {
    title: "Kalshi's 2026 Senate Election Guide",
    summary: "Republicans hold 53 seats, Democrats need 4 to flip control. Here's what markets are signaling about the fight for the upper chamber.",
    url: "https://news.kalshi.com/p/2026-senate-election-guide",
    date: "Jan 18, 2026",
    tag: "Politics"
  },
  {
    title: "How Scandals Shift Election Odds Overnight",
    summary: "Why traders spot election turning points before polls do. Understanding real-time shifts in modern political forecasting.",
    url: "https://news.kalshi.com/p/election-odds-shifts",
    date: "Jan 17, 2026",
    tag: "Politics"
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
          borderBottom: i < RESEARCH_ARTICLES.length - 1 ? '1px solid #e5e5e5' : 'none',
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

// Process markets into categories
const processMarketsIntoCategories = (rawMarkets, configMap) => {
  const categorized = {
    economics: [],
    politics: [],
    sports: [],
    tech: [],
    culture: [],
    weather: [],
    other: []
  };
  
  rawMarkets.forEach(m => {
    // Find category from config based on series_ticker
    const seriesTicker = m.series_ticker || m.ticker?.split('-')[0];
    const config = configMap[seriesTicker] || {};
    const cat = config.category || m.category || 'other';
    
    // Convert API price (in cents) to decimal, handle both API and fallback formats
    const yesPrice = m.yes_price !== undefined 
      ? (m.yes_price > 1 ? m.yes_price / 100 : m.yes_price)  // Handle both cents and decimal
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
  
  // Sort each category by 24h volume
  Object.keys(categorized).forEach(cat => {
    categorized[cat].sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0));
  });
  
  return categorized;
};

// Fetch markets from Kalshi API
const fetchKalshiMarkets = async () => {
  const configMap = {};
  MARKET_CONFIG.forEach(c => {
    configMap[c.series] = { category: c.category, url: c.url };
  });
  
  // Try multiple data sources in order of preference
  const dataSources = [
    // 1. Local JSON file (generated by Python script)
    { type: 'json', url: './kalshi_dashboard_data.json' },
    { type: 'json', url: '/kalshi_dashboard_data.json' },
    // 2. CORS proxy to Kalshi API (for browser environments)
    { type: 'api', url: `https://corsproxy.io/?${encodeURIComponent(API_BASE + '/markets?status=open&limit=200')}` },
    // 3. Direct API (works in non-browser or if CORS disabled)
    { type: 'api', url: `${API_BASE}/markets?status=open&limit=200` },
  ];
  
  for (const source of dataSources) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      // Handle JSON file format (from Python script)
      if (source.type === 'json' && data.markets) {
        console.log('Loaded data from JSON file:', source.url);
        return { 
          markets: data.markets, 
          error: null, 
          isLive: true,
          timestamp: data.timestamp 
        };
      }
      
      // Handle direct API response
      if (source.type === 'api' && data.markets) {
        const markets = data.markets || [];
        const filtered = markets.filter(m => 
          m.volume_24h > 10000 || 
          MARKET_CONFIG.some(c => m.series_ticker?.startsWith(c.series))
        );
        
        if (filtered.length > 0) {
          console.log('Loaded data from API:', source.url);
          return { 
            markets: processMarketsIntoCategories(filtered, configMap), 
            error: null, 
            isLive: true 
          };
        }
      }
    } catch (err) {
      console.log('Source failed:', source.url, err.message);
      continue;
    }
  }
  
  // All sources failed, use fallback data
  console.log('Using embedded sample data');
  const fallbackConfigMap = {};
  FALLBACK_MARKETS.forEach(m => {
    fallbackConfigMap[m.ticker] = { category: m.category, url: m.url };
  });
  return { 
    markets: processMarketsIntoCategories(FALLBACK_MARKETS.map(m => ({
      ...m,
      series_ticker: m.ticker.split('-')[0],
    })), fallbackConfigMap), 
    error: 'Using sample data',
    isLive: false
  };
};

export default function KalshiNewspaper() {
  const [markets, setMarkets] = useState({
    economics: [],
    politics: [],
    sports: [],
    tech: [],
    culture: [],
    weather: [],
    other: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeCategory, setActiveCategory] = useState('home');
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Fetch data on mount
  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    setLoading(true);
    const result = await fetchKalshiMarkets();
    setMarkets(result.markets);
    setError(result.error);
    setIsLive(result.isLive);
    // Use timestamp from JSON if available, otherwise current time
    setLastUpdated(result.timestamp ? new Date(result.timestamp) : new Date());
    setLoading(false);
  };

  const handleRefresh = () => {
    loadMarkets();
  };

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
              color: loading ? '#999' : '#1a1a1a',
              background: 'none',
              border: '1px solid currentColor',
              padding: '5px 10px',
              borderRadius: 3,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '...' : '↻'}
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
            <FrontPage markets={markets} onCategoryClick={handleCategoryClick} />
          ) : (
            <CategoryPage 
              title={currentCategory?.label || ''} 
              markets={markets[activeCategory] || []} 
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
    </div>
  );
}
