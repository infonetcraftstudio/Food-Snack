import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Activity, ClipboardList, Clock3, Download, LogOut, Settings2, ShieldCheck, Soup, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ManagementPage() {
  const user = await getCurrentUser();
  const displayName = user?.fullName ?? 'MGMT';
  const [employees, shifts, orders, pending] = await Promise.all([
    db.user.count({ where: { role: 'EMPLOYEE', isActive: true } }),
    db.shift.count({ where: { isActive: true } }),
    db.order.count({ where: { orderDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    db.order.count({ where: { status: 'ORDERED', collectionStatus: 'PENDING' } }),
  ]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark small"><Soup size={17} /></div><span>Platewise</span></div>
        <nav className="nav-list management-nav">
          <Link className="nav-item active" href="/mgmt"><Activity size={17} /> Overview</Link>
          <Link className="nav-item" href="/mgmt/services"><Settings2 size={17} /> Services & menus</Link>
          <Link className="nav-item" href="/collection"><ClipboardList size={17} /> Collection desk</Link>
          <Link className="nav-item" href="/Admin"><Clock3 size={17} /> Admin controls</Link>
        </nav>
        <div className="sidebar-footer"><div className="avatar">MG</div><div><strong>{displayName}</strong><small>MGMT</small></div><form action="/api/auth/logout" method="post"><button aria-label="Sign out"><LogOut size={16} /></button></form></div>
      </aside>
      <section className="content-area">
        <header className="topbar"><div><p className="eyebrow">Management workspace</p><h1>Operations overview</h1></div><Link className="secondary-button" href="/mgmt/reports"><Download size={16} /> Reports</Link></header>
        <div className="dashboard-grid">
          <div className="stats-row"><Stat label="Active employees" value={employees} icon={<Users size={19} />} note="Live directory" /><Stat label="Active shifts" value={`${shifts} / 6`} icon={<Clock3 size={19} />} note="Admin configured" accent /><Stat label="Orders today" value={orders} icon={<ClipboardList size={19} />} note="All services" /><Stat label="Awaiting collection" value={pending} icon={<Activity size={19} />} note="Needs attention" /></div>
          <section className="wide-panel" id="controls"><div className="panel-heading"><div><p className="eyebrow">Management controls</p><h2>Run today&apos;s service</h2></div></div><div className="operation-list"><Control icon={<Soup />} title="Services and menus" detail="Create custom food and snack services and manage menu quantities." href="/mgmt/services" action="Manage services" /><Control icon={<Clock3 />} title="Booking controls" detail="Open, close, reopen, or override booking with audit records." href="/mgmt/services#booking" action="Open controls" /><Control icon={<ShieldCheck />} title="Collection desk" detail={`${pending} orders are waiting for collection.`} href="/collection" action="Open collection" /></div></section>
          <section className="wide-panel report-preview"><div className="panel-heading"><div><p className="eyebrow">Reporting</p><h2>Daily service pulse</h2></div><Link className="text-button" href="/mgmt/reports">View reports →</Link></div><div className="chart-placeholder"><div className="chart-empty"><Activity size={22} /><span>Open reports to filter live order and collection data.</span></div></div></section>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, icon, note, accent = false }: { label: string; value: string | number; icon: React.ReactNode; note: string; accent?: boolean }) { return <div className={`stat-card ${accent ? 'accent' : ''}`}><div className="stat-icon">{icon}</div><p>{label}</p><strong>{value}</strong><small>{note}</small></div>; }
function Control({ icon, title, detail, href, action }: { icon: React.ReactNode; title: string; detail: string; href: string; action: string }) { return <div className="operation-row"><div className="operation-icon">{icon}</div><div className="operation-copy"><strong>{title}</strong><span>{detail}</span></div><Link className="text-button" href={href}>{action} →</Link></div>; }
