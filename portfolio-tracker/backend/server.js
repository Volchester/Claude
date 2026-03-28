import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import axios from 'axios';
import yahooFinance from 'yahoo-finance2';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, 'portfolio.csv');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure CSV exists with header
async function ensureCsv() {
  try {
    await fs.access(CSV_PATH);
  } catch {
    await fs.writeFile(CSV_PATH, 'id,symbol,name,type,quantity,buy_price\n');
  }
}

async function readPortfolio() {
  const content = await fs.readFile(CSV_PATH, 'utf-8');
  if (!content.trim() || content.trim() === 'id,symbol,name,type,quantity,buy_price') {
    return [];
  }
  return parse(content, { columns: true, skip_empty_lines: true });
}

async function writePortfolio(rows) {
  const csv = stringify(rows, {
    header: true,
    columns: ['id', 'symbol', 'name', 'type', 'quantity', 'buy_price'],
  });
  await fs.writeFile(CSV_PATH, csv);
}

// Fetch price from Yahoo Finance (stocks/ETFs)
async function fetchStockPrice(symbol) {
  try {
    const quote = await yahooFinance.quote(symbol);
    return {
      price: quote.regularMarketPrice,
      currency: quote.currency || 'USD',
      name: quote.shortName || quote.longName || symbol,
    };
  } catch {
    return null;
  }
}

// Fetch price from CoinGecko (crypto)
async function fetchCryptoPrice(symbol) {
  try {
    const id = symbol.toLowerCase();
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      { timeout: 5000 }
    );
    const price = res.data[id]?.usd;
    if (!price) return null;
    return { price, currency: 'USD', name: symbol.toUpperCase() };
  } catch {
    return null;
  }
}

// GET /api/portfolio — list holdings with live prices
app.get('/api/portfolio', async (req, res) => {
  await ensureCsv();
  const rows = await readPortfolio();

  const enriched = await Promise.all(
    rows.map(async (row) => {
      let live = null;
      if (row.type === 'crypto') {
        live = await fetchCryptoPrice(row.symbol);
      } else {
        live = await fetchStockPrice(row.symbol);
      }

      const quantity = parseFloat(row.quantity);
      const buyPrice = parseFloat(row.buy_price);
      const currentPrice = live?.price ?? null;
      const currentValue = currentPrice !== null ? currentPrice * quantity : null;
      const costBasis = buyPrice * quantity;
      const gainLoss = currentValue !== null ? currentValue - costBasis : null;
      const gainLossPct = costBasis > 0 && gainLoss !== null ? (gainLoss / costBasis) * 100 : null;

      return {
        ...row,
        quantity,
        buy_price: buyPrice,
        current_price: currentPrice,
        current_value: currentValue,
        cost_basis: costBasis,
        gain_loss: gainLoss,
        gain_loss_pct: gainLossPct,
        currency: live?.currency ?? 'USD',
        display_name: live?.name ?? row.name,
      };
    })
  );

  res.json(enriched);
});

// POST /api/portfolio — add holding
app.post('/api/portfolio', async (req, res) => {
  await ensureCsv();
  const { symbol, name, type, quantity, buy_price } = req.body;
  if (!symbol || !type || !quantity || !buy_price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const rows = await readPortfolio();
  const id = Date.now().toString();
  rows.push({ id, symbol: symbol.toUpperCase(), name: name || symbol, type, quantity, buy_price });
  await writePortfolio(rows);
  res.status(201).json({ id });
});

// DELETE /api/portfolio/:id — remove holding
app.delete('/api/portfolio/:id', async (req, res) => {
  await ensureCsv();
  const rows = await readPortfolio();
  const filtered = rows.filter((r) => r.id !== req.params.id);
  if (filtered.length === rows.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  await writePortfolio(filtered);
  res.json({ ok: true });
});

// GET /api/search?q=AAPL — search ticker symbol
app.get('/api/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);
  try {
    const results = await yahooFinance.search(q);
    const quotes = (results.quotes || []).slice(0, 6).map((r) => ({
      symbol: r.symbol,
      name: r.shortname || r.longname || r.symbol,
      type: r.quoteType === 'ETF' ? 'etf' : 'stock',
    }));
    res.json(quotes);
  } catch {
    res.json([]);
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Portfolio backend running on http://0.0.0.0:${PORT}`));
