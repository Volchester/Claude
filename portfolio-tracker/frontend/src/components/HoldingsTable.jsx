import React from 'react';

export default function HoldingsTable({ holdings, onDelete }) {
  if (holdings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#4a5568', border: '1px dashed #2d3148', borderRadius: 10 }}>
        Zatim zadna aktiva. Pridej prvni kliknutim na "+ Pridat aktivum".
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #2d3148', color: '#64748b', textAlign: 'right' }}>
            <Th align="left">Aktivum</Th>
            <Th>Typ</Th>
            <Th>Mnozstvi</Th>
            <Th>Nakup. cena</Th>
            <Th>Akt. cena</Th>
            <Th>Hodnota</Th>
            <Th>Zisk / Ztrata</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <Row key={h.id} h={h} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ h, onDelete }) {
  const positive = h.gain_loss === null ? null : h.gain_loss >= 0;
  const gainColor = positive === null ? '#94a3b8' : positive ? '#4ade80' : '#f87171';

  return (
    <tr style={{ borderBottom: '1px solid #1e2130' }}>
      <td style={{ padding: '0.875rem 0.5rem' }}>
        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{h.symbol}</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {h.display_name}
        </div>
      </td>
      <td style={tdStyle}><TypeBadge type={h.type} /></td>
      <Td>{h.quantity}</Td>
      <Td>${fmt(h.buy_price)}</Td>
      <Td>{h.current_price !== null ? `$${fmt(h.current_price)}` : <span style={{ color: '#4a5568' }}>N/A</span>}</Td>
      <Td style={{ fontWeight: 600 }}>${fmt(h.current_value ?? h.cost_basis)}</Td>
      <td style={{ ...tdStyle, color: gainColor }}>
        {h.gain_loss !== null ? (
          <>
            <div>{h.gain_loss >= 0 ? '+' : ''}${fmt(h.gain_loss)}</div>
            <div style={{ fontSize: '0.75rem' }}>{h.gain_loss_pct >= 0 ? '+' : ''}{h.gain_loss_pct.toFixed(2)}%</div>
          </>
        ) : '—'}
      </td>
      <td style={{ padding: '0.875rem 0.5rem', textAlign: 'right' }}>
        <button
          onClick={() => onDelete(h.id)}
          style={{ background: 'transparent', color: '#4a5568', fontSize: '1rem', padding: '0.25rem 0.5rem' }}
          title="Odebrat"
        >
          ×
        </button>
      </td>
    </tr>
  );
}

function Th({ children, align = 'right' }) {
  return <th style={{ padding: '0.75rem 0.5rem', textAlign: align, fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</th>;
}

const tdStyle = { padding: '0.875rem 0.5rem', textAlign: 'right', color: '#cbd5e1' };
function Td({ children, style }) {
  return <td style={{ ...tdStyle, ...style }}>{children}</td>;
}

function TypeBadge({ type }) {
  const map = { stock: ['#3b82f6', 'Akcie'], etf: ['#8b5cf6', 'ETF'], crypto: ['#f59e0b', 'Krypto'] };
  const [color, label] = map[type] ?? ['#64748b', type];
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: 4, padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 600,
    }}>{label}</span>
  );
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}
