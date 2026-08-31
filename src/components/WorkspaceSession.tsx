'use client';

import { LogOut } from 'lucide-react';

export function WorkspaceSession({ area }: { area: 'ADMIN' | 'MANAGEMENT' | 'FOOD_COLLECTION_STAFF' | 'EMPLOYEE' }) {
  async function logout() {
    await fetch(`/api/auth/logout?area=${area}&redirect=1`, { method: 'POST' });
    window.location.href = '/login';
  }

  return <button className="workspace-logout" onClick={logout}><LogOut size={15} /> Sign out</button>;
}
