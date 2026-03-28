import React, { useEffect, useState, useCallback } from 'react';
import Summary from './components/Summary.jsx';
import HoldingsTable from './components/HoldingsTable.jsx';
import AddHoldingForm from './components/AddHoldingForm.jsx';

const API = '/api';

export default function App() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPortfolio = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${API}/portfolio`);
      if (!res.ok) throw new Error('Server error');
      setHoldings(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleAdd = async (data) => {
    const res = await fetch(`${API}/portfolio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Nepodařilo se přidat aktivum');
    setShowForm(false);
    await fetchPortfolio();
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/portfolio/${id}`, { method: 'DELETE' });
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <Header
        onRefresh={() => fetchPortfolio(true)}
        refreshing={refreshing}
        onAdd={() => setShowForm(true)}
      />

      {loading && <p style={{ color: '#94a3b8', marginTop: '2rem' }}>Načítám portfolio a ceny...</p>}
      {error && <p style={{ color: '#f87171', marginTop: '1rem' }}>Chyba: {error}</p>}

      {!loading && (
        <>
          <Summary holdings={holdings} />
          <HoldingsTable holdings={holdings} onDelete={handleDelete} />
        </>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <AddHoldingForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}

function Header({ onRefresh, refreshing, onAdd }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9' }}>Portfolio Tracker</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 2 }}>Akcie · ETF · Kryptomeny</p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          style={{ background: '#1e2130', color: '#94a3b8', border: '1px solid #2d3148' }}
        >
          {refreshing ? 'Obnovuji...' : 'Obnovit ceny'}
        </button>
        <button onClick={onAdd} style={{ background: '#6366f1', color: '#fff' }}>
          + Pridat aktivum
        </button>
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#1a1d2e', borderRadius: 12, padding: '2rem',
        width: '100%', maxWidth: 460, border: '1px solid #2d3148',
      }}>
        {children}
      </div>
    </div>
  );
}
