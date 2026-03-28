import React, { useState, useRef, useEffect } from 'react';

export default function AddHoldingForm({ onSubmit, onCancel }) {
  const [type, setType] = useState('stock');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  const searchSymbol = (q) => {
    if (type === 'crypto') return; // crypto uses manual symbol
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 1) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        setSuggestions(await res.json());
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 350);
  };

  const handleSymbolChange = (v) => {
    setSymbol(v);
    searchSymbol(v);
  };

  const pickSuggestion = (s) => {
    setSymbol(s.symbol);
    setName(s.name);
    setType(s.type);
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol || !quantity || !buyPrice) { setError('Vyplnte vsechna pole'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ symbol, name, type, quantity: parseFloat(quantity), buy_price: parseFloat(buyPrice) });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', color: '#f1f5f9' }}>Pridat aktivum</h2>

      <Field label="Typ aktiva">
        <select value={type} onChange={(e) => { setType(e.target.value); setSuggestions([]); }}>
          <option value="stock">Akcie</option>
          <option value="etf">ETF</option>
          <option value="crypto">Kryptomena</option>
        </select>
      </Field>

      <Field label={type === 'crypto' ? 'ID na CoinGecko (napr. bitcoin)' : 'Ticker symbol'}>
        <div style={{ position: 'relative' }}>
          <input
            value={symbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            placeholder={type === 'crypto' ? 'bitcoin, ethereum...' : 'AAPL, MSFT, SPY...'}
            autoComplete="off"
          />
          {searching && <span style={{ position: 'absolute', right: 10, top: 8, color: '#64748b', fontSize: '0.75rem' }}>...</span>}
          {suggestions.length > 0 && (
            <ul style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
              background: '#1a1d2e', border: '1px solid #2d3148', borderRadius: 6,
              marginTop: 2, listStyle: 'none', padding: '0.25rem 0',
            }}>
              {suggestions.map((s) => (
                <li
                  key={s.symbol}
                  onClick={() => pickSuggestion(s)}
                  style={{ padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2d3148'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontWeight: 600 }}>{s.symbol}</span>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: 8 }}>{s.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Field>

      <Field label="Nazev (volitelne)">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple Inc." />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Field label="Mnozstvi">
          <input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="10" />
        </Field>
        <Field label="Nakupni cena (USD)">
          <input type="number" min="0" step="any" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="150.00" />
        </Field>
      </div>

      {error && <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel} style={{ background: '#1e2130', color: '#94a3b8', border: '1px solid #2d3148' }}>
          Zrusit
        </button>
        <button type="submit" disabled={submitting} style={{ background: '#6366f1', color: '#fff' }}>
          {submitting ? 'Pridavam...' : 'Pridat'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.375rem', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}
