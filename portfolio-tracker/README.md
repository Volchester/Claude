# Portfolio Tracker

Jednoduchy portfolio tracker pro akcie, ETF a kryptomeny.

## Spusteni

### 1. Backend
```bash
cd backend
npm install
npm run dev
```
Bezi na http://localhost:3001

### 2. Frontend (v jinem terminalu)
```bash
cd frontend
npm install
npm run dev
```
Otevre se na http://localhost:3000

## Funkce
- Pridavani akcii, ETF a kryptomen
- Live ceny: akcie/ETF z Yahoo Finance, krypto z CoinGecko
- Prehled zisku/ztraty pro kazde aktivum
- Celkove portfolio summary
- Ulozeni do CSV souboru (`backend/portfolio.csv`)

## Pridani kryptomeny
Pouzij ID z CoinGecko, napr.:
- `bitcoin` (BTC)
- `ethereum` (ETH)
- `solana` (SOL)
