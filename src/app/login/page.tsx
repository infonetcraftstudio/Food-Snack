'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, Utensils } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const response = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, password }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? 'Unable to sign in.');
      setLoading(false);
      return;
    }
    router.push(result.destination ?? '/');
    router.refresh();
  }

  return (
    <main className="login-shell">
      <section className="login-brand-panel">
        <div className="brand-mark"><Utensils size={20} strokeWidth={2.5} /></div>
        <p className="eyebrow">Nourish / Connect / Collect</p>
        <h1>Good food,<br /><em>well managed.</em></h1>
        <p className="brand-copy">A single, dependable place for every meal booking across your company.</p>
        <div className="brand-rule" />
        <p className="fine-print">Secure access for employees and operations teams.</p>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <p className="eyebrow">Company food services</p>
          <h2>Welcome back</h2>
          <p className="muted">Sign in with your employee credentials to continue.</p>
          <form onSubmit={submit} className="login-form">
            <label>Employee ID<input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. EMP001" autoComplete="username" required /></label>
            <label>Password<div className="input-with-icon"><LockKeyhole size={16} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></div></label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={17} /></button>
          </form>
          <p className="login-note">Need access help? Contact your system administrator.</p>
        </div>
      </section>
    </main>
  );
}
