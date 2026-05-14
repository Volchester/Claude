import YahooFinance from 'yahoo-finance2';
import fs from 'fs';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const SYMBOLS = [
  // Mega cap tech
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'TSLA', 'TSM',
  // Tech / Software
  'NFLX', 'AMD', 'INTC', 'CRM', 'ADBE', 'PYPL', 'ORCL', 'IBM', 'CSCO',
  'AVGO', 'QCOM', 'TXN', 'MU', 'AMAT', 'LRCX', 'KLAC', 'ASML', 'NOW',
  'PLTR', 'SNOW', 'CRWD', 'PANW', 'NET', 'DDOG', 'ZS', 'OKTA', 'TEAM',
  'SHOP', 'SQ', 'COIN', 'HOOD', 'RBLX', 'U', 'PATH', 'AI', 'SMCI',
  'ARM', 'MRVL', 'MCHP', 'ADI', 'NXPI', 'WDAY', 'INTU', 'FTNT',
  // Auto / EV
  'F', 'GM', 'RIVN', 'LCID', 'NIO', 'XPEV', 'LI',
  // Finance
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC', 'SCHW',
  'BRK-B', 'BLK', 'AXP', 'V', 'MA', 'COF', 'BX', 'KKR',
  // Healthcare
  'JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'LLY', 'TMO', 'DHR', 'ABT',
  'MDT', 'BMY', 'AMGN', 'GILD', 'CVS', 'CI', 'HUM', 'ELV', 'ISRG',
  'REGN', 'VRTX', 'BIIB', 'MRNA',
  // Consumer
  'WMT', 'HD', 'KO', 'PEP', 'MCD', 'NKE', 'DIS', 'COST', 'SBUX',
  'TGT', 'LOW', 'BKNG', 'CMG', 'YUM', 'KHC', 'PM', 'MO', 'CL',
  'PG', 'EL', 'ULTA', 'LULU', 'ROST', 'TJX', 'DG', 'DLTR',
  // Energy
  'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'OXY', 'VLO', 'MPC', 'PSX',
  // Industrial
  'BA', 'GE', 'CAT', 'MMM', 'HON', 'RTX', 'LMT', 'NOC', 'GD',
  'UPS', 'FDX', 'DE', 'EMR', 'ETN', 'ITW',
  // Comms / Media
  'T', 'VZ', 'TMUS', 'CMCSA', 'CHTR',
  // International
  'BABA', 'JD', 'PDD', 'BIDU', 'NVO',
  // ETFs - broad
  'SPY', 'QQQ', 'VOO', 'VTI', 'IVV', 'VEA', 'IEMG', 'IWM', 'DIA',
  'EEM', 'EFA', 'VYM', 'SCHD', 'VIG',
  // ETFs - sectors
  'XLE', 'XLF', 'XLK', 'XLV', 'XLP', 'XLY', 'XLI', 'XLU', 'XLB',
  'XLRE', 'XBI', 'IBB', 'SOXX', 'SMH', 'VNQ',
  // ETFs - bonds / gold
  'BND', 'GLD', 'SLV', 'TLT', 'IEF', 'AGG', 'LQD', 'HYG',
  // ETFs - thematic
  'ARKK', 'ARKW', 'ARKG', 'JEPI', 'JEPQ',
  // Indices
  '^VIX', '^GSPC', '^IXIC', '^DJI', '^RUT',
  // Crypto
  'BTC-USD', 'ETH-USD', 'SOL-USD',
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchYahooBatch(symbols) {
  const out = {};
  try {
    const quotes = await yf.quote(symbols, {}, { validateResult: false });
    const arr = Array.isArray(quotes) ? quotes : [quotes];
    for (const q of arr) {
      if (q?.symbol && q?.regularMarketPrice > 0) {
        out[q.symbol] = {
          price: q.regularMarketPrice,
          change1d: q.regularMarketChangePercent ?? null,
        };
      }
    }
  } catch (e) {
    console.error('Yahoo batch failed:', e.message?.slice(0, 100));
  }
  return out;
}

function stooqSymbol(symbol) {
  if (symbol.startsWith('^')) return symbol.slice(1).toLowerCase();
  if (symbol.includes('-USD')) return symbol.replace(/-USD$/, '').toLowerCase() + 'usd';
  return symbol.toLowerCase() + '.us';
}

async function fetchStooq(symbol) {
  const sSym = stooqSymbol(symbol);
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(sSym)}&f=sd2t2ohlcv&h&e=json`;
  const r = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const item = data?.symbols?.[0];
  if (!item) return null;
  const close = parseFloat(item.Close ?? item.close ?? 0);
  const open = parseFloat(item.Open ?? item.open ?? 0);
  if (!(close > 0)) return null;
  return {
    price: close,
    change1d: open > 0 ? ((close - open) / open * 100) : null,
  };
}

async function fetchYahooChart(symbol) {
  const enc = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${enc}?interval=1d&range=5d`;
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!(meta?.regularMarketPrice > 0)) return null;
  const price = meta.regularMarketPrice;
  const prev = meta.previousClose ?? meta.chartPreviousClose;
  return {
    price,
    change1d: prev > 0 ? ((price - prev) / prev * 100) : null,
  };
}

const result = {
  updated: new Date().toISOString(),
  prices: {},
};

console.log(`Fetching ${SYMBOLS.length} symbols...`);
const start = Date.now();

// Step 1: Yahoo Finance batch via yahoo-finance2 (handles cookie/crumb auth)
console.log('Step 1: Yahoo batch via yahoo-finance2...');
Object.assign(result.prices, await fetchYahooBatch(SYMBOLS));
let got = Object.keys(result.prices).length;
console.log(`  ${got}/${SYMBOLS.length}`);

// Step 2: Yahoo chart direct for missing, in small batches to avoid throttling
let missing = SYMBOLS.filter(s => !result.prices[s]);
if (missing.length) {
  console.log(`Step 2: Yahoo chart for ${missing.length} missing...`);
  for (let i = 0; i < missing.length; i += 5) {
    const batch = missing.slice(i, i + 5);
    await Promise.all(batch.map(async sym => {
      try {
        const d = await fetchYahooChart(sym);
        if (d) result.prices[sym] = d;
      } catch {}
    }));
    if (i + 5 < missing.length) await sleep(500);
  }
  got = Object.keys(result.prices).length;
  console.log(`  ${got}/${SYMBOLS.length}`);
}

// Step 3: Stooq sequential with 300ms delay (rate-limit friendly)
missing = SYMBOLS.filter(s => !result.prices[s]);
if (missing.length) {
  console.log(`Step 3: Stooq sequential for ${missing.length} missing...`);
  for (const sym of missing) {
    try {
      const d = await fetchStooq(sym);
      if (d) result.prices[sym] = d;
    } catch {}
    await sleep(300);
  }
  got = Object.keys(result.prices).length;
  console.log(`  ${got}/${SYMBOLS.length}`);
}

const took = ((Date.now() - start) / 1000).toFixed(1);
console.log(`Done: ${got}/${SYMBOLS.length} in ${took}s`);

if (got > 0) {
  fs.writeFileSync('prices.json', JSON.stringify(result, null, 2));
  console.log('Wrote prices.json');
} else if (fs.existsSync('prices.json')) {
  // 0 prices – preserve existing data but update timestamp so we can see the
  // workflow is still running (timestamp freshness ≠ price freshness in this case)
  const existing = JSON.parse(fs.readFileSync('prices.json', 'utf8'));
  existing.updated = new Date().toISOString();
  fs.writeFileSync('prices.json', JSON.stringify(existing, null, 2));
  console.log('WARNING: 0 prices fetched. Preserved existing prices, updated timestamp.');
} else {
  console.error('FATAL: No prices and no existing prices.json.');
  process.exit(1);
}
