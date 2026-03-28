import React from 'react';

export default function Summary({ holdings }) {
  const totalValue = holdings.reduce((s, h) => s + (h.current_value ?? h.cost_basis), 0);
  const totalCost = holdings.reduce((s, h) => s + h.cost_basis, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const byType = holdings.reduce((acc, h) => {
    acc[h.type] = (acc[h.type] || 0) + (h.current_value ?? h.cost_basis);
    return acc;
  }, {});

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      <Card label="Celková hodnota" value={`$${fmt(totalValue)}`} />
      <Card
        label="Zisk / Ztráta"
        value={`${totalGain >= 0 ? '+' : ''}$${fmt(totalGain)}`}
        sub={`${totalGain >= 0 ? '+' : ''}${totalGainPct.toFixed(2)}%`}
        positive={totalGain >= 0}
      />
      <Card label="Pocet aktiv" value={holdings.length} />
      {Object.entries(byType).map(([type, val]) => (
        <Card key={type} label={typeLabel(type)} value={`$${fmt(val)}`} />
      ))}
    </div>
  );
}

function Card({ label, value, sub, positive }) {
  const color = positive === undefined ? '#f1f5f9' : positive ? '#4ade80' : '#f87171';
  return (
    <div style={{
      background: '#1a1d2e', border: '1px solid #2d3148', borderRadius: 10,
      padding: '1.25rem 1.5rem',
    }}>
      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</p>
      {sub && <p style={{ fontSize: '0.875rem', color, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function typeLabel(t) {
  return { stock: 'Akcie', etf: 'ETF', crypto: 'Krypto' }[t] ?? t;
}
