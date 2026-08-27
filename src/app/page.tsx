import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { WorkspaceSession } from '@/components/WorkspaceSession';
import { Activity, ClipboardList, Clock3, Download, LayoutDashboard, LogOut, Settings2, ShieldCheck, Soup, Users, Utensils, ChevronDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

function roleLabel(role: string) {
  return role === 'MANAGEMENT' ? 'MGMT' : role === 'FOOD_COLLECTION_STAFF' ? 'COL' : role === 'ADMIN' ? 'ADMIN' : 'Employee';
}

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'ADMIN') redirect('/Admin');
  if (user.role === 'MANAGEMENT') redirect('/mgmt');
  if (user.role === 'FOOD_COLLECTION_STAFF') redirect('/collection');

  const [activeEmployees, activeShifts, todayOrders, pendingCollections, employeeServices] = await Promise.all([
    db.user.count({ where: { role: 'EMPLOYEE', isActive: true } }),
    db.shift.count({ where: { isActive: true } }),
    db.order.count({ where: { orderDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    db.order.count({ where: { collectionStatus: 'PENDING', status: 'ORDERED' } }),
    user.role === 'EMPLOYEE' && user.shiftId ? db.service.findMany({ where: { shiftId: user.shiftId, serviceDate: { gte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())), lt: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1)) }, isActive: true }, include: { menuItems: { where: { isActive: true }, orderBy: { name: 'asc' } } }, orderBy: { name: 'asc' } }) : Promise.resolve([]),
  ]);

  const role = user.role as string;
  const isEmployee = role === 'EMPLOYEE';
  const nav = isEmployee ? ['Overview', 'My orders', 'Order history'] : ['Overview', 'Live operations', 'Services & menus', 'Reports', ...(role === 'ADMIN' ? ['Users & shifts', 'Audit log', 'Settings'] : [])];

  return (
    <><WorkspaceSession area="EMPLOYEE" /><main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark small"><Utensils size={17} /></div><span>Platewise</span></div>
        <div className="workspace-switch"><span className="workspace-dot" /> Company dining <ChevronDown size={14} /></div>
        <nav className="nav-list">{isEmployee ? <><Link href="/" className="nav-item active"><LayoutDashboard size={17} />Overview</Link><Link href="/orders" className="nav-item"><ClipboardList size={17} />My orders</Link><Link href="/orders/history" className="nav-item"><Clock3 size={17} />Order history</Link></> : nav.map((item, index) => <div key={item} className={`nav-item ${index === 0 ? 'active' : ''}`}><LayoutDashboard size={17} />{item}</div>)}</nav>
        {!isEmployee && <div className="sidebar-callout"><p className="eyebrow">Today at a glance</p><strong>{todayOrders} <span>orders</span></strong><small>{pendingCollections} pending collection</small></div>}
        <div className="sidebar-footer"><div className="avatar">{user.fullName.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div><div><strong>{user.fullName}</strong><small>{roleLabel(user.role)}</small></div><form action="/api/auth/logout" method="post"><button aria-label="Sign out"><LogOut size={16} /></button></form></div>
      </aside>
      <section className="content-area">
        <header className="topbar"><div><p className="eyebrow">{isEmployee ? 'Employee workspace' : 'Operations workspace'}</p><h1>{isEmployee ? `Good morning, ${user.fullName.split(' ')[0]}` : 'Operations overview'}</h1></div><div className="topbar-actions"><span className="status-pill"><span /> System operational</span><button className="icon-button" aria-label="Settings"><Settings2 size={18} /></button></div></header>
        {isEmployee ? <EmployeeView user={user} services={employeeServices} /> : <OperationsView activeEmployees={activeEmployees} activeShifts={activeShifts} todayOrders={todayOrders} pendingCollections={pendingCollections} isAdmin={role === 'ADMIN'} />}
      </section>
    </main></>
  );
}

type EmployeeService = Awaited<ReturnType<typeof db.service.findMany>>[number] & { menuItems: { id: string; name: string; availableQty: number }[] };

function EmployeeView({ user, services }: { user: Awaited<ReturnType<typeof getCurrentUser>>; services: EmployeeService[] }) {
  return <div className="dashboard-grid employee-grid">
    <section className="welcome-banner"><div><p className="eyebrow">Your dining profile</p><h2>{user?.shift ? user.shift.name : 'Shift assignment pending'}</h2><p>{user?.shift ? `${user.shift.startTime} - ${user.shift.endTime} · Your assigned services will appear here.` : 'An administrator needs to assign your shift before services can be displayed.'}</p></div><div className="banner-icon"><Clock3 size={32} /></div></section>
    <section className="section-heading"><div><p className="eyebrow">Today</p><h2>Available services</h2></div><span className="date-stamp">{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span></section>
    {!user?.shift ? <div className="empty-state"><div className="empty-icon"><ClipboardList size={23} /></div><h3>No services yet</h3><p>Your available food and snack services are automatically based on your assigned shift.</p></div> : services.length === 0 ? <div className="empty-state"><div className="empty-icon"><Soup size={23} /></div><h3>No services scheduled</h3><p>Your shift is active, but there are no services scheduled for today.</p></div> : <div className="employee-service-list">{services.map((service) => <article className="employee-service" key={service.id}><div><span className="type-label">{service.type}</span><h3>{service.name}</h3><p>{service.menuItems.length} menu item{service.menuItems.length === 1 ? '' : 's'} available</p></div><Link className="primary-button" href="/order">View menu →</Link></article>)}</div>}
    <section className="quick-note"><ShieldCheck size={18} /><span>Orders are tied to your employee ID and can only be collected after your identity is verified.</span></section>
  </div>;
}

function OperationsView({ activeEmployees, activeShifts, todayOrders, pendingCollections, isAdmin }: { activeEmployees: number; activeShifts: number; todayOrders: number; pendingCollections: number; isAdmin: boolean }) {
  return <div className="dashboard-grid"><div className="stats-row"><StatCard label="Active employees" value={activeEmployees} icon={<Users size={19} />} trend="Live directory" /><StatCard label="Active shifts" value={`${activeShifts} / 6`} icon={<Clock3 size={19} />} trend={activeShifts === 0 ? 'Setup required' : 'Capacity limit'} accent /><StatCard label="Orders today" value={todayOrders} icon={<ClipboardList size={19} />} trend="Across all services" /><StatCard label="Awaiting collection" value={pendingCollections} icon={<Activity size={19} />} trend="Needs attention" /></div>
    <section className="wide-panel"><div className="panel-heading"><div><p className="eyebrow">Command center</p><h2>Food service operations</h2></div><button className="secondary-button"><Download size={16} /> Export report</button></div><div className="operation-list"><OperationRow icon={<Clock3 />} title="Shift configuration" detail={activeShifts === 0 ? 'Create your first active shift to unlock service scheduling.' : `${activeShifts} active shifts configured`} action={isAdmin ? 'Manage shifts' : 'View shifts'} /><OperationRow icon={<Soup />} title="Service schedule" detail="Services and menus are created per shift and date." action="Open services" /><OperationRow icon={<ShieldCheck />} title="Collection desk" detail={`${pendingCollections} orders are waiting to be collected.`} action="Open collection" /></div></section>
    <section className="wide-panel report-preview"><div className="panel-heading"><div><p className="eyebrow">Reporting</p><h2>Daily service pulse</h2></div><button className="text-button">View all reports <ArrowMini /></button></div><div className="chart-placeholder"><div className="chart-empty"><Activity size={22} /><span>Reports will populate as orders are placed.</span></div></div></section>
  </div>;
}

function StatCard({ label, value, icon, trend, accent }: { label: string; value: string | number; icon: React.ReactNode; trend: string; accent?: boolean }) { return <div className={`stat-card ${accent ? 'accent' : ''}`}><div className="stat-icon">{icon}</div><p>{label}</p><strong>{value}</strong><small>{trend}</small></div>; }
function OperationRow({ icon, title, detail, action }: { icon: React.ReactNode; title: string; detail: string; action: string }) { return <div className="operation-row"><div className="operation-icon">{icon}</div><div className="operation-copy"><strong>{title}</strong><span>{detail}</span></div><button className="text-button">{action} <ArrowMini /></button></div>; }
function ArrowMini() { return <span aria-hidden="true">→</span>; }
