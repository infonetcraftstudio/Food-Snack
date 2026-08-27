'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Clock3, Plus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

type Shift = { id: string; name: string; startTime: string; endTime: string; isActive: boolean };

export default function ShiftManagementPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [form, setForm] = useState({ name: '', startTime: '09:00', endTime: '17:00' });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  async function load() { const response = await fetch('/api/admin/shifts'); const data = await response.json(); if (response.ok) setShifts(data.shifts); else setError(data.error); }
  useEffect(() => { load(); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setSaved(''); const response = await fetch('/api/admin/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, isActive: true }) }); const data = await response.json(); if (!response.ok) setError(data.error); else { setSaved('Shift created. You can now assign employees and add services.'); setForm({ name: '', startTime: '09:00', endTime: '17:00' }); load(); } }
  return <main className="admin-page"><Link href="/" className="back-link"><ArrowLeft size={17} /> Dashboard</Link><div className="admin-heading"><div><p className="eyebrow">Admin only</p><h1>Shift management</h1><p className="muted">Create the company&apos;s shift structure before scheduling food services.</p></div><span className="capacity-badge">{shifts.filter((shift) => shift.isActive).length} / 6 active</span></div><div className="admin-layout"><form className="admin-form" onSubmit={submit}><div className="form-icon"><Plus size={19} /></div><h2>Add a new shift</h2><p className="muted">Overnight shifts are supported automatically when the end time is earlier than the start time.</p><label>Shift name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Fulfillment A" required /></label><div className="time-fields"><label>Start time<input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required /></label><label>End time<input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} required /></label></div>{error && <p className="form-error">{error}</p>}{saved && <p className="success-message">{saved}</p>}<button className="primary-button" disabled={shifts.filter((shift) => shift.isActive).length >= 6}>Create active shift <Plus size={16} /></button></form><section className="shift-list"><div className="panel-heading"><div><p className="eyebrow">Configured shifts</p><h2>All shifts</h2></div><ShieldCheck size={19} color="#1e6b4f" /></div>{shifts.length === 0 ? <div className="empty-state compact"><Clock3 size={22} /><h3>Zero shifts configured</h3><p>This is the expected starting state. Add your first shift to begin setup.</p></div> : <div className="shift-rows">{shifts.map((shift) => <div className="shift-row" key={shift.id}><div className="shift-row-icon"><Clock3 size={17} /></div><div><strong>{shift.name}</strong><small>{shift.startTime} - {shift.endTime}</small></div><span className={shift.isActive ? 'active-label' : 'inactive-label'}>{shift.isActive ? 'Active' : 'Inactive'}</span></div>)}</div>}</section></div></main>;
}
