'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingBasket } from 'lucide-react';
import Link from 'next/link';

type MenuItem = { id: string; name: string; description: string | null; availableQty: number; maxPerEmployee: number };
type Service = { id: string; name: string; type: string; state: string; menuItems: MenuItem[] };

export default function OrderPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/services').then((response) => response.json()).then((data) => setServices(data.services ?? [])).finally(() => setLoading(false)); }, []);
  function update(id: string, value: number, max: number) { setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(max, value)) })); }
  async function submit(serviceId: string) { setMessage(''); const items = Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([menuItemId, quantity]) => ({ menuItemId, quantity })); const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceId, items }) }); const data = await response.json(); setMessage(response.ok ? 'Order confirmed. Your food is pending collection.' : data.error); if (response.ok) setQuantities({}); }
  return <main className="order-page"><header className="order-header"><Link href="/" className="back-link"><ArrowLeft size={17} /> Dashboard</Link><p className="eyebrow">Employee ordering</p><h1>Choose your service</h1><p className="muted">Only services assigned to your shift are shown.</p></header>{loading ? <div className="empty-state">Loading today's services...</div> : services.length === 0 ? <div className="empty-state"><div className="empty-icon"><ShoppingBasket size={22} /></div><h3>No services available</h3><p>Your shift may not have a service scheduled today, or your booking window has not opened.</p></div> : <div className="service-cards">{services.map((service) => <section className="service-card" key={service.id}><div className="service-card-head"><div><span className="type-label">{service.type}</span><h2>{service.name}</h2></div><span className={`booking-state ${service.state.toLowerCase()}`}>{service.state.replaceAll('_', ' ')}</span></div><div className="menu-list">{service.menuItems.map((item) => <div className="menu-row" key={item.id}><div><strong>{item.name}</strong><small>{item.description ?? `${item.availableQty} available`}</small></div><div className="stepper"><button disabled={service.state !== 'OPEN' || quantities[item.id] === 0} onClick={() => update(item.id, (quantities[item.id] ?? 0) - 1, item.maxPerEmployee)} aria-label={`Decrease ${item.name}`}><Minus size={15} /></button><b>{quantities[item.id] ?? 0}</b><button disabled={service.state !== 'OPEN' || (quantities[item.id] ?? 0) >= Math.min(item.maxPerEmployee, item.availableQty)} onClick={() => update(item.id, (quantities[item.id] ?? 0) + 1, Math.min(item.maxPerEmployee, item.availableQty))} aria-label={`Increase ${item.name}`}><Plus size={15} /></button></div></div>)}</div><button className="primary-button order-submit" disabled={service.state !== 'OPEN' || !service.menuItems.some((item) => (quantities[item.id] ?? 0) > 0)} onClick={() => submit(service.id)}>Confirm order <ShoppingBasket size={16} /></button></section>)}</div>}{message && <p className="order-message">{message}</p>}</main>;
}
