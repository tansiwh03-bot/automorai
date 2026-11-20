import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

// Sales Report (2026-11-18). Built only from the shop's real website orders (same data as the Orders tab,
// GET /automorai/website-orders, owner-verified). Nothing here is estimated or invented.
//  - Sales = product_price × quantity (delivery charge excluded — that money goes to the courier)
//  - cancelled orders are not counted as sales
//  - days are Bangladesh days (Asia/Dhaka)

export interface ReportOrder {
  id: string; product_title: string; product_price: number; quantity: number;
  payment_method: string; status: string; delivery_location: string; created_at: string;
}

const C = { surface: '#ffffff', border: '#e4eaf3', ink: '#17243b', ink2: '#40536f', muted: '#718096', series: '#2563eb', up: '#16a879', down: '#dc5555' };
const DAY = 86400000;
const dhakaDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); // YYYY-MM-DD
const taka = (n: number) => '৳' + Math.round(n).toLocaleString('en-IN');
const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#fbbf24' }, confirmed: { label: 'Confirmed', color: '#6366f1' },
  shipped: { label: 'Shipped', color: '#38bdf8' }, delivered: { label: 'Delivered', color: '#4ade80' },
  cancelled: { label: 'Cancelled', color: '#f87171' },
};
const PAY: Record<string, string> = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad', bank: 'Bank Transfer' };

function summarize(list: ReportOrder[]) {
  const live = list.filter(o => o.status !== 'cancelled');
  const sales = live.reduce((s, o) => s + (o.product_price || 0) * (o.quantity || 1), 0);
  const delivered = list.filter(o => o.status === 'delivered').length;
  return { orders: list.length, liveOrders: live.length, sales, avg: live.length ? sales / live.length : 0, delivered };
}

const Change = ({ now, before }: { now: number; before: number }) => {
  if (!before) return <span style={{ color: C.muted, fontSize: '0.78rem' }}>{now ? 'New this period' : '—'}</span>;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  return <span style={{ color: up ? C.up : C.down, fontSize: '0.8rem', fontWeight: 700 }}>{up ? '▲' : '▼'} {Math.abs(pct)}% <span style={{ color: C.muted, fontWeight: 400 }}>vs previous</span></span>;
};

const card: React.CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, boxShadow: '0 8px 26px rgba(15,39,83,.06)' };

export default function SalesReport({ orders, loading }: { orders: ReportOrder[]; loading: boolean }) {
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const r = useMemo(() => {
    const now = Date.now();
    const valid = orders.filter(o => !isNaN(new Date(o.created_at).getTime()));
    const cur = valid.filter(o => now - new Date(o.created_at).getTime() < range * DAY);
    const prev = valid.filter(o => { const a = now - new Date(o.created_at).getTime(); return a >= range * DAY && a < 2 * range * DAY; });
    // one point per day, oldest → today, empty days = 0 (a missing day must not look like a straight line)
    const byDay: Record<string, { sales: number; orders: number }> = {};
    for (let i = range - 1; i >= 0; i--) byDay[dhakaDay(new Date(now - i * DAY))] = { sales: 0, orders: 0 };
    cur.forEach(o => {
      const k = dhakaDay(new Date(o.created_at)); if (!byDay[k]) return;
      byDay[k].orders += 1;
      if (o.status !== 'cancelled') byDay[k].sales += (o.product_price || 0) * (o.quantity || 1);
    });
    const series = Object.entries(byDay).map(([d, v]) => ({ d, label: new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), ...v }));
    const prodMap: Record<string, { units: number; sales: number }> = {};
    cur.filter(o => o.status !== 'cancelled').forEach(o => {
      const k = o.product_title || 'Unknown'; prodMap[k] = prodMap[k] || { units: 0, sales: 0 };
      prodMap[k].units += o.quantity || 1; prodMap[k].sales += (o.product_price || 0) * (o.quantity || 1);
    });
    const top = Object.entries(prodMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.sales - a.sales).slice(0, 5);
    const count = (key: (o: ReportOrder) => string) => cur.reduce((m, o) => { const k = key(o); m[k] = (m[k] || 0) + 1; return m; }, {} as Record<string, number>);
    return { cur: summarize(cur), prev: summarize(prev), series, top, status: count(o => o.status || 'pending'), pay: count(o => o.payment_method || 'cod'), loc: count(o => o.delivery_location === 'outside' ? 'Outside Dhaka' : 'Dhaka') };
  }, [orders, range]);

  if (loading) return <div style={{ color: C.muted, padding: 24 }}>Loading report...</div>;

  const tiles = [
    { label: 'Sales', value: taka(r.cur.sales), now: r.cur.sales, before: r.prev.sales },
    { label: 'Orders', value: String(r.cur.orders), now: r.cur.orders, before: r.prev.orders },
    { label: 'Average order', value: taka(r.cur.avg), now: r.cur.avg, before: r.prev.avg },
    { label: 'Delivered', value: r.cur.orders ? `${Math.round((r.cur.delivered / r.cur.orders) * 100)}%` : '—', sub: `${r.cur.delivered} of ${r.cur.orders} orders` },
  ];
  const maxTop = Math.max(1, ...r.top.map(p => p.sales));
  const Breakdown = ({ title, data, colors, labels }: { title: string; data: Record<string, number>; colors?: Record<string, string>; labels?: Record<string, string> }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    return (
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{title}</div>
        {total === 0 ? <div style={{ color: C.muted, fontSize: '0.85rem' }}>No orders in this period.</div> :
          Object.entries(data).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 4 }}>
                <span style={{ color: C.ink2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {colors && <span style={{ width: 9, height: 9, borderRadius: 9, background: colors[k] || C.muted }} />}{labels?.[k] || k}
                </span>
                <span style={{ color: C.ink, fontWeight: 600 }}>{v} <span style={{ color: C.muted, fontWeight: 400 }}>({Math.round((v / total) * 100)}%)</span></span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: '#edf1f7' }}><div style={{ height: '100%', width: `${(v / total) * 100}%`, borderRadius: 4, background: colors?.[k] || C.series }} /></div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <h2 style={{ color: '#2563eb', margin: 0 }}>📈 Sales Report</h2>
        <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 3 }}>
          {([7, 30, 90] as const).map(d => (
            <button key={d} onClick={() => setRange(d)} style={{ border: 'none', cursor: 'pointer', padding: '7px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', background: range === d ? '#2563eb' : 'transparent', color: range === d ? 'white' : C.muted }}>Last {d} days</button>
          ))}
        </div>
      </div>

      {orders.length === 0 && (
        <div style={{ ...card, marginBottom: 16, color: C.ink2 }}>No orders yet. When buyers order from your shop, your sales, best products and growth will show here. Share your shop link on Facebook to get the first orders.</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        {tiles.map(t => (
          <div key={t.label} style={card}>
            <div style={{ color: C.muted, fontSize: '0.85rem', marginBottom: 6 }}>{t.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 6 }}>{t.value}</div>
            {t.sub ? <span style={{ color: C.muted, fontSize: '0.78rem' }}>{t.sub}</span> : <Change now={t.now!} before={t.before!} />}
          </div>
        ))}
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700 }}>Daily sales</div>
        <div style={{ color: C.muted, fontSize: '0.8rem', marginBottom: 10 }}>Bangladesh time · tap a day to see its numbers</div>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={r.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id="srFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.series} stopOpacity={0.35} /><stop offset="100%" stopColor={C.series} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="#e9eef6" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={52} tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
              <Tooltip cursor={{ stroke: C.muted, strokeDasharray: '3 3' }} contentStyle={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 10, color: '#17243b' }}
                labelStyle={{ color: C.ink2 }} formatter={(v: number, _n, p: any) => [`${taka(v)} · ${p.payload.orders} order${p.payload.orders === 1 ? '' : 's'}`, 'Sales']} />
              <Area type="monotone" dataKey="sales" stroke={C.series} strokeWidth={2} fill="url(#srFill)" activeDot={{ r: 5, stroke: C.surface, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Best selling products</div>
          {r.top.length === 0 ? <div style={{ color: C.muted, fontSize: '0.85rem' }}>No sales in this period.</div> : r.top.map(p => (
            <div key={p.name} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.88rem', marginBottom: 4 }}>
                <span style={{ color: C.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name} <span style={{ color: C.muted }}>· {p.units} sold</span></span>
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{taka(p.sales)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: '#edf1f7' }}><div style={{ height: '100%', width: `${(p.sales / maxTop) * 100}%`, borderRadius: 4, background: C.series }} /></div>
            </div>
          ))}
        </div>
        <Breakdown title="Order status" data={r.status} colors={Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.color]))} labels={Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.label]))} />
        <Breakdown title="Payment method" data={r.pay} labels={PAY} />
        <Breakdown title="Delivery area" data={r.loc} />
      </div>

      <div style={{ color: C.muted, fontSize: '0.78rem' }}>Sales = product price × quantity, without delivery charge. Cancelled orders are not counted as sales. Only orders from your Automorai website are included.</div>
    </div>
  );
}
