import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../API/API.mjs';

export default function StaffReports({ wsMessage }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carica i report all'avvio
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await API.fetchReports();
        if (mounted) setReports(r || []);
      } catch (e) {
        console.error(e);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  // Aggiorna la lista dei report in tempo reale quando arriva un messaggio via WebSocket
  useEffect(() => {
    if (!wsMessage) return;
    async function refresh() {
      try {
        const r = await API.fetchReports();
        setReports(r || []);
      } catch {}
    }
    refresh();
  }, [wsMessage]);

  if (loading) return <div className="container mt-4">Loading reports...</div>;

  const pending = (reports || []).filter(r => String(r.status || '').toLowerCase() === 'pending');

  return (
    <div className="container my-4">
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h3 className="mb-0">Pending Reports</h3>
            <span className="badge bg-secondary">{pending.length}</span>
          </div>

          <div className="list-group list-group-flush">
            {pending.length === 0 && <div className="list-group-item">No pending reports.</div>}
            {pending.map(r => (
              <Link key={r.id} to={`/review/${r.id}`} className="list-group-item list-group-item-action">
                <div className="d-flex w-100 justify-content-between align-items-start gap-3">
                  <h5 className="mb-1 text-truncate">{r.title}</h5>
                  <small className="text-muted text-nowrap">{r.status}</small>
                </div>
                <p className="mb-1 text-muted">{r.description}</p>
                <small className="text-muted">Category: {r.category?.name || r.categoryId} — by user {r.userId}</small>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
