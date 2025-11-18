import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API, { SERVER_URL } from '../API/API.mjs';

export default function ReportReview({ user, loggedIn }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const r = await API.fetchReport(id);
        setReport(r);
        setCategoryId(r.categoryId);
        const cats = await API.fetchCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    }
    load();
  }, [id]);

  if (!loggedIn) return <div className="container mt-4">Please log in to review reports.</div>;

  const handleAccept = async () => {
    try {
      const updated = await API.reviewReport(id, { action: 'accept', categoryId });
      setMessage('Report assigned.');
      setReport(updated);
      navigate('/reports');
    } catch (err) {
      setMessage('Error accepting report: ' + String(err));
    }
  };

  const handleReject = async () => {
    if (!explanation.trim()) { setMessage('Please provide an explanation for rejection.'); return; }
    try {
      const updated = await API.reviewReport(id, { action: 'reject', explanation });
      setMessage('Report rejected.');
      setReport(updated);
      navigate('/reports');
    } catch (err) {
      setMessage('Error rejecting report: ' + String(err));
    }
  };

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (!report) return <div className="container mt-4">Report not found.</div>;

  return (
    <div className="container mt-4">
      <h3>Review Report</h3>
      <div className="card p-3 mb-3">
        <h5>{report.title}</h5>
        <p>{report.description}</p>
        <p><strong>Coordinates:</strong> {report.latitude}, {report.longitude}</p>
        <p><strong>Status:</strong> {report.status}</p>
        {report.reject_explanation && (
          <p><strong>Rejection:</strong> {report.reject_explanation}</p>
        )}
        <div className="mb-3">
          <label className="form-label">Category</label>
          <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">-- Select category --</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Photos</label>
          <div>
            {(report.photos || []).map((p, idx) => (
              <img key={idx} src={`${SERVER_URL}${p.link}`} alt={`photo-${idx}`} style={{ maxWidth: 200, marginRight: 8 }} />
            ))}
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Rejection explanation</label>
          <textarea className="form-control" value={explanation} onChange={e => setExplanation(e.target.value)} />
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success" onClick={handleAccept}>Accept</button>
          <button className="btn btn-danger" onClick={handleReject}>Reject</button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
        </div>
        {message && <div className="alert alert-info mt-3">{message}</div>}
      </div>
    </div>
  );
}
