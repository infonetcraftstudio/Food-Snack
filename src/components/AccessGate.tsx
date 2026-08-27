'use client';

import { FormEvent, ReactNode, useState } from 'react';
import { LockKeyhole } from 'lucide-react';

export function AccessGate({ area, title, children }: { area: 'ADMIN' | 'MANAGEMENT' | 'FOOD_COLLECTION_STAFF'; title: string; children: ReactNode }) {
  const [authorized, setAuthorized] = useState(false); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); const response = await fetch('/api/auth/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ area, password }) }); const data = await response.json(); if (!response.ok) setError(data.error); else setAuthorized(true); setLoading(false); }
  if (authorized) return <>{children}</>;
  return <main className="access-page"><div className="access-card"><div className="form-icon"><LockKeyhole size={20} /></div><p className="eyebrow">Protected workspace</p><h1>{title}</h1><p className="muted">Enter the workspace password to continue.</p><form className="login-form" onSubmit={submit}><label>Access password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Checking...' : 'Continue'} <LockKeyhole size={16} /></button></form></div></main>;
}
