'use client';

import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, Search, ShieldCheck, Utensils } from 'lucide-react';
import Link from 'next/link';

type Order = { id: string; service: { name: string }; orderItems: { quantity: number; menuItem: { name: string } }[] };
type Verified = { employeeId: string; fullName: string; shift: string | null };

export default function CollectionPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [verified, setVerified] = useState<Verified | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function verify(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    const response = await fetch('/api/collection/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId, password }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error); setVerified(null); setOrders([]); return; }
    setVerified(data.employee); setOrders(data.orders);
  }

  async function collect(orderId: string) {
    const response = await fetch('/api/collection/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, employeeId: verified?.employeeId }) });
    const data = await response.json();
    if (!response.ok) setError(data.error); else { setOrders((current) => current.filter((order) => order.id !== orderId)); setMessage('Collection confirmed.'); }
  }

  return <main className="collection-page">
    <Link href="/" className="back-link"><ArrowLeft size={17} /> Dashboard</Link>
    <div className="collection-header"><div className="brand-mark"><Utensils size={20} /></div><p className="eyebrow">COL collection desk</p><h1>Verify and collect</h1><p className="muted">Authenticate the employee before showing any pending orders.</p></div>
    {!verified ? <form className="collection-login" onSubmit={verify}><div className="form-icon"><ShieldCheck size={19} /></div><h2>Employee verification</h2><label>Employee ID<input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} placeholder="e.g. EMP001" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button">Verify employee <Search size={16} /></button></form> : <section className="verified-panel"><div className="verified-heading"><div><p className="eyebrow">Employee verified</p><h2>{verified.fullName}</h2><p className="muted">{verified.employeeId} · {verified.shift ?? 'No shift assigned'}</p></div><CheckCircle2 color="#1e6b4f" /></div>{message && <p className="success-message">{message}</p>}{orders.length === 0 ? <div className="empty-state compact"><CheckCircle2 size={22} /><h3>No pending orders</h3><p>This employee has no food or snack orders waiting for collection.</p></div> : <div className="pending-orders">{orders.map((order) => <div className="pending-order" key={order.id}><div><span className="type-label">Pending collection</span><h3>{order.service.name}</h3>{order.orderItems.map((item) => <p key={item.menuItem.name}>{item.menuItem.name} × {item.quantity}</p>)}</div><button className="primary-button" onClick={() => collect(order.id)}>Confirm collection <CheckCircle2 size={16} /></button></div>)}</div>}<button className="text-button" onClick={() => { setVerified(null); setOrders([]); setPassword(''); setMessage(''); }}>Verify another employee →</button></section>}
  </main>;
}
