'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, Download } from 'lucide-react';

type Summary = { orders: number; collected: number; notCollected: number; quantity: number };
export default function ReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null); const [error, setError] = useState('');
  useEffect(() => { fetch('/api/reports').then(async (response) => { const data = await response.json(); if (!response.ok) setError(data.error); else setSummary(data.summary); }); }, []);
  return <main className="admin-page"><Link className="back-link" href="/mgmt"><ArrowLeft size={17} /> Management overview</Link><header className="admin-heading"><div><p className="eyebrow">Management reporting</p><h1>Daily reports</h1><p className="muted">Live order and collection totals from the database.</p></div><a className="secondary-button" href="/api/reports" download><Download size={16} /> Download data</a></header>{error && <p className="form-error admin-alert">{error}</p>}<div className="stats-row"><Metric label="Orders" value={summary?.orders ?? '...'} /><Metric label="Item quantity" value={summary?.quantity ?? '...'} /><Metric label="Collected" value={summary?.collected ?? '...'} /><Metric label="Not collected" value={summary?.notCollected ?? '...'} /></div><section className="wide-panel report-preview"><div className="empty-state compact"><ClipboardList size={22} /><h3>Report data is live</h3><p>Use the Download data button for the detailed JSON report, including each employee order and menu item.</p></div></section></main>;
}
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="stat-card"><div className="stat-icon"><ClipboardList size={19} /></div><p>{label}</p><strong>{value}</strong></div>; }
