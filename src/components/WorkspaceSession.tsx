'use client';

import { useEffect } from 'react';
import { LogOut } from 'lucide-react';

export function WorkspaceSession({ area }: { area: 'ADMIN' | 'MANAGEMENT' | 'FOOD_COLLECTION_STAFF' | 'EMPLOYEE' }) {
  useEffect(() => {
    const logoutOnClose = () => {
      const body = JSON.stringify({ area });
      navigator.sendBeacon('/api/auth/logout', new Blob([body], { type: 'application/json' }));
    };
    window.addEventListener('pagehide', logoutOnClose);
    return () => window.removeEventListener('pagehide', logoutOnClose);
  }, [area]);

  async function logout() {
    await fetch(`/api/auth/logout?area=${area}`, { method: 'POST' });
    window.location.href = '/login';
  }

  return <button className="workspace-logout" onClick={logout}><LogOut size={15} /> Sign out</button>;
}
