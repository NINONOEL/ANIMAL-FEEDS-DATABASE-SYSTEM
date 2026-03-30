import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
         BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { useRecords } from '../hooks/useRecords';
import { PROVINCES, MUNICIPALITIES, NATURE_OF_BUSINESS_TYPES } from '../data/constants';
import { C, PROV_GRAD, PIE_COLORS, REG_PIE, LTO_PIE } from '../data/colors';

const STRONG_BORDER = C.p2;
const SOFT_BORDER = C.p3;

/* ── Palette (exact from pinky.jpg) ────────────────────────────
 *   #E6789A  #F08CA9  #F5A6BD  #F9C1D3
 * ─────────────────────────────────────────────────────────── */

/* ── helpers ───────────────────────────────────────────────── */
function PctLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.52;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * R)}
      y={cy + r * Math.sin(-midAngle * R)}
      textAnchor="middle" dominantBaseline="central"
      fill="white" style={{ fontSize: 10, fontWeight: 700 }}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl px-4 py-2.5 text-xs"
      style={{ border: `1.5px solid ${SOFT_BORDER}` }}>
      <p className="font-bold" style={{ color: C.text }}>{payload[0].name}</p>
      <p className="font-semibold mt-0.5" style={{ color: C.p1 }}>{payload[0].value.toLocaleString()} records</p>
    </div>
  );
}

function legendFmt(v) {
  return <span style={{ fontSize: 10, fontWeight: 600, color: C.text }}>{v}</span>;
}

/* ── stat card ─────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, cardBg, iconBg }) {
  return (
    <div className="rounded-2xl shadow-sm overflow-hidden"
      style={{ background: cardBg, border: `1.5px solid ${STRONG_BORDER}` }}>
      <div className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
          style={{ background: iconBg }}>
          <Icon icon={icon} className="text-white text-2xl" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium leading-tight whitespace-normal break-words"
            style={{ color: C.p1 }}>
            {label}
          </p>
          <p className="text-2xl font-black leading-tight" style={{ color: C.text }}>{value.toLocaleString()}</p>
          {sub && <p className="text-[10px] leading-tight mt-0.5 font-semibold" style={{ color: C.dark }}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── province card ─────────────────────────────────────────── */
function ProvinceCard({ province, records, headerGrad }) {
  const total       = records.length;
  const retailer    = records.reduce((s, r) => s + (Number(r.feedRetailer)    || 0), 0);
  const distributor = records.reduce((s, r) => s + (Number(r.feedDistributor) || 0), 0);
  const dealer      = records.reduce((s, r) => s + (Number(r.feedDealer)      || 0), 0);
  const newReg      = records.filter(r => r.registration === 'new').length;
  const renew       = records.filter(r => r.registration === 'renew').length;
  const updated     = records.filter(r => r.lto === 'updated').length;
  const expired     = records.filter(r => r.lto === 'expired').length;
  const isMindoroProvince = province.endsWith('Mindoro');
  const mindoroPrefix = isMindoroProvince ? province.replace(' Mindoro', '') : '';

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden"
      style={{ background: C.white, border: `1.5px solid ${STRONG_BORDER}` }}>

      {/* header */}
      <div className="h-16 px-4 py-3 text-white flex items-start justify-between"
        style={{ background: headerGrad }}>
        <div className="pr-2">
          <p className="text-sm font-bold leading-tight">
            {isMindoroProvince ? (
              <>
                {mindoroPrefix}
                <br />
                Mindoro
              </>
            ) : province}
          </p>
        </div>
        <div className="text-right self-start">
          <p className="text-[10px] font-semibold text-white">Total</p>
          <p className="text-2xl font-black leading-none">{total}</p>
        </div>
      </div>

      {/* 3 types */}
      <div className="px-4 pt-3 pb-2 space-y-1.5">
        {[
          { label:'Feed Retailer',    val:retailer,    icon:'mdi:storefront-outline' },
          { label:'Feed Distributor', val:distributor, icon:'mdi:truck-delivery-outline' },
          { label:'Feed Dealer',      val:dealer,      icon:'mdi:handshake-outline' },
        ].map(item => (
          <div
            key={item.label}
            className="flex items-center justify-between text-xs rounded-lg px-2 py-1.5"
            style={{ border: `1px solid ${SOFT_BORDER}` }}
          >
            <div className="flex items-center gap-1.5" style={{ color: C.p1 }}>
              <Icon icon={item.icon} className="text-sm" style={{ color: C.p1 }} />
              <span>{item.label}</span>
            </div>
            <span className="font-bold" style={{ color: C.text }}>{item.val}</span>
          </div>
        ))}
      </div>

      <div className="mx-4 my-2 h-px" style={{ background: SOFT_BORDER }} />

      {/* status mini-badges */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-1.5 text-[10px]">
        {[
          { label:'New',     val:newReg,  bg:C.p1,   fg:'white' },
          { label:'Renew',   val:renew,   bg:C.p2,   fg:'white' },
          { label:'Updated', val:updated, bg:C.p4,   fg:C.text  },
          { label:'Expired', val:expired, bg:C.deep, fg:'white'  },
        ].map(b => (
          <div key={b.label} className="rounded-lg px-2 py-1.5 flex items-center justify-between"
            style={{ background: b.bg }}>
            <span className="font-medium" style={{ color: b.fg }}>{b.label}</span>
            <span className="font-black"  style={{ color: b.fg }}>{b.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── chart card ────────────────────────────────────────────── */
function ChartCard({ title, icon, children }) {
  return (
    <div className="rounded-2xl shadow-sm overflow-hidden"
      style={{ background: C.white, border: `1.5px solid ${STRONG_BORDER}` }}>
      <div className="px-5 py-3.5 flex items-center gap-2"
        style={{ background: `linear-gradient(135deg, ${C.p4}, ${C.p3})`, borderBottom: `1.5px solid ${SOFT_BORDER}` }}>
        <Icon icon={icon} className="text-lg" style={{ color: C.deep }} />
        <h3 className="text-sm font-bold" style={{ color: C.text }}>{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center">
      <Icon icon="mdi:chart-pie-outline" className="text-5xl mb-2" style={{ color: C.p1 }} />
      <p className="text-xs font-semibold" style={{ color: C.text }}>No data yet</p>
      <p className="text-[10px] mt-0.5 font-medium" style={{ color: C.dark }}>Add records to see charts</p>
    </div>
  );
}

/* ── color helpers ──────────────────────────────────────────── */
function shiftColor(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

/* ── 3D Box Bar shape ───────────────────────────────────────── */
function Box3DBar({ x, y, width, height, fill }) {
  if (!height || height <= 0) return null;
  const depth = Math.min(width * 0.34, 28);
  const dY    = depth * 0.52;
  const bw    = width - depth;
  const id    = `b3d-${Math.round(x)}`;

  const light  = shiftColor(fill,  70);
  const mid    = shiftColor(fill,  25);
  const dark   = shiftColor(fill, -55);
  const darker = shiftColor(fill, -85);

  const topPts  = `${x},${y} ${x+depth},${y-dY} ${x+bw+depth},${y-dY} ${x+bw},${y}`;
  const sidePts = `${x+bw},${y} ${x+bw+depth},${y-dY} ${x+bw+depth},${y+height-dY} ${x+bw},${y+height}`;

  return (
    <g>
      <defs>
        {/* front face: light top → dark bottom (actual colors, not overlays) */}
        <linearGradient id={`${id}-fg`} gradientUnits="userSpaceOnUse"
          x1={x} y1={y} x2={x} y2={y + height}>
          <stop offset="0%"   stopColor={light} />
          <stop offset="45%"  stopColor={fill}  />
          <stop offset="100%" stopColor={dark}  />
        </linearGradient>
        {/* front face left-edge gloss sheen */}
        <linearGradient id={`${id}-sh`} gradientUnits="userSpaceOnUse"
          x1={x} y1={y} x2={x + bw * 0.5} y2={y}>
          <stop offset="0%"   stopColor="#fff" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0}    />
        </linearGradient>
        {/* top face: very light → mid color */}
        <linearGradient id={`${id}-tp`} gradientUnits="userSpaceOnUse"
          x1={x} y1={y - dY} x2={x + bw + depth} y2={y}>
          <stop offset="0%"   stopColor={light} />
          <stop offset="100%" stopColor={mid}   />
        </linearGradient>
        {/* top face gloss */}
        <linearGradient id={`${id}-tg`} gradientUnits="userSpaceOnUse"
          x1={x} y1={y - dY} x2={x + bw * 0.7} y2={y}>
          <stop offset="0%"   stopColor="#fff" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0}    />
        </linearGradient>
        {/* side face: dark → darker */}
        <linearGradient id={`${id}-sd`} gradientUnits="userSpaceOnUse"
          x1={x + bw} y1={y} x2={x + bw} y2={y + height}>
          <stop offset="0%"   stopColor={dark}   />
          <stop offset="100%" stopColor={darker} />
        </linearGradient>
      </defs>

      {/* ── front face ── */}
      <rect x={x} y={y} width={bw} height={height} fill={`url(#${id}-fg)`} rx={3} />
      <rect x={x} y={y} width={bw * 0.5} height={height} fill={`url(#${id}-sh)`} rx={3} />

      {/* ── top face ── */}
      <polygon points={topPts} fill={`url(#${id}-tp)`} />
      <polygon points={topPts} fill={`url(#${id}-tg)`} />

      {/* ── right side face ── */}
      <polygon points={sidePts} fill={`url(#${id}-sd)`} />

      {/* ── edge highlight (front-left vertical line) ── */}
      <line x1={x} y1={y} x2={x} y2={y + height}
        stroke="#fff" strokeOpacity={0.4} strokeWidth={1.5} />
      {/* ── edge highlight (top-front line) ── */}
      <line x1={x} y1={y} x2={x + bw} y2={y}
        stroke="#fff" strokeOpacity={0.5} strokeWidth={1} />
    </g>
  );
}

/* ── main ──────────────────────────────────────────────────── */
export default function SummaryPage() {
  const { records, loading } = useRecords();

  function normalizeToken(s) {
    return String(s ?? '')
      .toUpperCase()
      .replace(/\./g, '')
      .replace(/,/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getProvinceForRecord(r, muniToProvinceMap) {
    const p = normalizeToken(r?.province);
    if (p && PROVINCES.map(normalizeToken).includes(p)) {
      const raw = PROVINCES.find(prov => normalizeToken(prov) === p);
      return raw || null;
    }

    const muni = normalizeToken(r?.municipality);
    if (!muni) return null;

    const direct = muniToProvinceMap[muni];
    if (direct) return direct;

    // Fallback: tolerant "includes" matching on municipality tokens
    for (const key of Object.keys(muniToProvinceMap)) {
      if (!key) continue;
      if (key.includes(muni) || muni.includes(key)) return muniToProvinceMap[key];
    }

    return null;
  }

  // Single pass: compute all stats + group records by province + NOB totals
  const { stats, byProvince, nobTotals } = useMemo(() => {
    let retailer = 0, distributor = 0, dealer = 0;
    let newReg = 0, renew = 0, updated = 0, expired = 0;
    const provMap = Object.fromEntries(PROVINCES.map(p => [p, []]));
    const nobMap  = Object.fromEntries(NATURE_OF_BUSINESS_TYPES.map(n => [n.key, 0]));
    const muniToProvinceMap = {};
    for (const prov of PROVINCES) {
      for (const muni of (MUNICIPALITIES[prov] || [])) {
        const k = normalizeToken(muni);
        if (!k) continue;
        muniToProvinceMap[k] = prov;
      }
    }

    for (const r of records) {
      retailer    += Number(r.feedRetailer)    || 0;
      distributor += Number(r.feedDistributor) || 0;
      dealer      += Number(r.feedDealer)      || 0;
      if (r.registration === 'new')    newReg++;
      else if (r.registration === 'renew') renew++;
      if (r.lto === 'updated')   updated++;
      else if (r.lto === 'expired')  expired++;
      const derivedProvince = getProvinceForRecord(r, muniToProvinceMap);
      if (derivedProvince && provMap[derivedProvince]) provMap[derivedProvince].push(r);
      for (const n of NATURE_OF_BUSINESS_TYPES) nobMap[n.key] += Number(r[n.key]) || 0;
    }

    return {
      stats: { total: records.length, retailer, distributor, dealer, newReg, renew, updated, expired },
      byProvince: PROVINCES.map(p => ({ province: p, records: provMap[p] })),
      nobTotals: nobMap,
    };
  }, [records]);

  // Single pass per province: retailer + distributor + dealer
  const feedBizByProvince = useMemo(() =>
    byProvince.map(p => {
      let retailer = 0, distributor = 0, dealer = 0;
      for (const r of p.records) {
        retailer    += Number(r.feedRetailer)    || 0;
        distributor += Number(r.feedDistributor) || 0;
        dealer      += Number(r.feedDealer)      || 0;
      }
      return {
        province: p.province,
        data: [
          { name: 'Feed Retailer',    value: retailer },
          { name: 'Feed Distributor', value: distributor },
          { name: 'Feed Dealer',      value: dealer },
        ].filter(d => d.value > 0),
        totals: { retailer, distributor, dealer, all: retailer + distributor + dealer },
      };
    }),
  [byProvince]);

  const provinceChartData = useMemo(() =>
    byProvince
      .map(p => ({ name: p.province.replace(' Mindoro', ''), value: p.records.length }))
      .filter(d => d.value > 0),
  [byProvince]);

  const regChartData = useMemo(() => [
    { name: 'New',   value: stats.newReg },
    { name: 'Renew', value: stats.renew  },
  ].filter(d => d.value > 0), [stats.newReg, stats.renew]);

  const ltoChartData = useMemo(() => [
    { name: 'Updated', value: stats.updated },
    { name: 'Expired', value: stats.expired },
  ].filter(d => d.value > 0), [stats.updated, stats.expired]);

  const nobChartData = useMemo(() =>
    NATURE_OF_BUSINESS_TYPES
      .map(n => ({ name: n.short, value: nobTotals[n.key] }))
      .filter(d => d.value > 0),
  [nobTotals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3" style={{ color: C.p1 }}>
          <Icon icon="mdi:loading" className="text-3xl animate-spin" />
          <span className="text-base font-semibold">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── title ── */}
      <div
        className="flex items-center justify-between rounded-2xl px-5 py-4 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${C.p4}, ${C.white})`, border: `1.5px solid ${STRONG_BORDER}` }}
      >
        <div>
          <h1 className="text-xl font-black leading-tight" style={{ color: C.text }}>
            MIMAROPA Region — Animal Feeds Overview
          </h1>
          <p className="text-xs mt-0.5 font-medium" style={{ color: C.dark }}>
            Regional performance snapshot with real-time updates and yearly LTO cycle monitoring
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-xs"
          style={{ border: `1.5px solid ${SOFT_BORDER}`, color: C.p1 }}>
          <Icon icon="mdi:database-check-outline" style={{ color: C.p1 }} className="text-base" />
          <span>{records.length} total records</span>
        </div>
      </div>

      {/* ── ROW 1 — 4 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="mdi:store-outline"         label="Total Animal Feeds Establishments" value={stats.total}       sub="MIMAROPA Region"
          cardBg={`linear-gradient(135deg,${C.p4},${C.p3}44)`} iconBg={`linear-gradient(135deg,${C.p1},${C.deep})`} />
        <StatCard icon="mdi:storefront-outline"    label="Feed Retailer (total)"             value={stats.retailer}    sub="All provinces"
          cardBg={`linear-gradient(135deg,${C.p4},${C.p3}44)`} iconBg={`linear-gradient(135deg,${C.p2},${C.p1})`} />
        <StatCard icon="mdi:truck-delivery-outline" label="Feed Distributor (total)"         value={stats.distributor} sub="All provinces"
          cardBg={`linear-gradient(135deg,${C.p4},${C.p3}44)`} iconBg={`linear-gradient(135deg,${C.p3},${C.p2})`} />
        <StatCard icon="mdi:handshake-outline"     label="Feed Dealer (total)"               value={stats.dealer}      sub="All provinces"
          cardBg={`linear-gradient(135deg,${C.p4},${C.p3}44)`} iconBg={`linear-gradient(135deg,${C.p1},${C.dark})`} />
      </div>

      {/* ── ROW 2 — Registration & LTO ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Registration */}
        <div className="rounded-2xl shadow-sm overflow-hidden"
          style={{ background: C.white, border: `1.5px solid ${STRONG_BORDER}` }}>
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg,${C.p1},${C.p3})` }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="mdi:file-document-check-outline" className="text-xl" style={{ color: C.p1 }} />
              <h3 className="text-sm font-bold" style={{ color: C.text }}>Registration Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:'New',    val:stats.newReg, bg:`${C.p1}22`, numColor:C.p1, lblColor:C.p1, icon:'mdi:file-plus-outline' },
                { label:'Renewal',val:stats.renew,  bg:`${C.p3}55`, numColor:C.text, lblColor:C.p2, icon:'mdi:file-refresh-outline' },
              ].map(item => (
                <div key={item.label} className="rounded-2xl p-4 text-center" style={{ background: item.bg, border: `1px solid ${SOFT_BORDER}` }}>
                  <Icon icon={item.icon} className="text-2xl mx-auto mb-1" style={{ color: item.lblColor }} />
                  <p className="text-3xl font-black" style={{ color: item.numColor }}>{item.val}</p>
                  <p className="text-xs font-bold mt-1 uppercase tracking-wide" style={{ color: item.lblColor }}>{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs font-medium" style={{ color: C.dark }}>
              Total: <span className="font-semibold" style={{ color: C.text }}>{stats.newReg + stats.renew}</span>
            </p>
          </div>
        </div>

        {/* LTO */}
        <div className="rounded-2xl shadow-sm overflow-hidden"
          style={{ background: C.white, border: `1.5px solid ${STRONG_BORDER}` }}>
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg,${C.p4},${C.p1})` }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="mdi:badge-account-outline" className="text-xl" style={{ color: C.p1 }} />
              <h3 className="text-sm font-bold" style={{ color: C.text }}>LTO Status</h3>
              <span className="ml-auto text-[10px] font-semibold flex items-center gap-1" style={{ color: C.dark }}>
                <Icon icon="mdi:calendar-alert" style={{ color: C.dark }} />
                Expires: December 31
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:'Updated', val:stats.updated, bg:`${C.p4}88`, numColor:C.text, lblColor:C.p2, icon:'mdi:check-circle-outline' },
                { label:'Expired', val:stats.expired, bg:`${C.p1}22`, numColor:C.p1,   lblColor:C.p1, icon:'mdi:alert-circle-outline' },
              ].map(item => (
                <div key={item.label} className="rounded-2xl p-4 text-center" style={{ background: item.bg, border: `1px solid ${SOFT_BORDER}` }}>
                  <Icon icon={item.icon} className="text-2xl mx-auto mb-1" style={{ color: item.lblColor }} />
                  <p className="text-3xl font-black" style={{ color: item.numColor }}>{item.val}</p>
                  <p className="text-xs font-bold mt-1 uppercase tracking-wide" style={{ color: item.lblColor }}>{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs font-medium" style={{ color: C.dark }}>
              Total: <span className="font-semibold" style={{ color: C.text }}>{stats.updated + stats.expired}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── ROW 3 — Province Cards ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="mdi:map-marker-multiple-outline" className="text-xl" style={{ color: C.p1 }} />
          <h2 className="text-base font-black" style={{ color: C.text }}>By Province</h2>
          <span className="text-xs font-medium ml-1" style={{ color: C.dark }}>
            — Retailer, Distributor & Dealer breakdown
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {byProvince.map((p, i) => (
            <ProvinceCard
              key={p.province}
              province={p.province}
              records={p.records}
              headerGrad={PROV_GRAD[i]}
            />
          ))}
        </div>
      </div>

      {/* ── ROW 4 — Charts & Analytics (temporarily hidden) ── */}
      {false && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="mdi:chart-pie" className="text-xl" style={{ color: C.p1 }} />
            <h2 className="text-base font-black" style={{ color: C.text }}>Charts & Analytics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <ChartCard title="By Province" icon="mdi:map-outline">
              {provinceChartData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart style={{ outline: "none" }}>
                    <Pie data={provinceChartData} cx="50%" cy="45%"
                      outerRadius={78} innerRadius={28} dataKey="value"
                      paddingAngle={3} labelLine={false} label={PctLabel}>
                      {provinceChartData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<Tip />} />
                    <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <ChartCard title="New vs Renewal" icon="mdi:file-document-check-outline">
              {regChartData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart style={{ outline: "none" }}>
                    <Pie data={regChartData} cx="50%" cy="45%"
                      outerRadius={78} innerRadius={28} dataKey="value"
                      paddingAngle={4} labelLine={false} label={PctLabel}>
                      {regChartData.map((_, i) => (
                        <Cell key={i} fill={REG_PIE[i]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<Tip />} />
                    <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {regChartData.length > 0 && (
                <div className="flex justify-center gap-6 mt-1">
                  <div className="text-center">
                    <p className="text-xl font-black" style={{ color: C.p1 }}>{stats.newReg}</p>
                    <p className="text-[10px] font-medium" style={{ color: C.dark }}>New</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black" style={{ color: C.dark }}>{stats.renew}</p>
                    <p className="text-[10px] font-medium" style={{ color: C.dark }}>Renewal</p>
                  </div>
                </div>
              )}
            </ChartCard>
            <ChartCard title="LTO: Updated vs Expired" icon="mdi:badge-account-outline">
              {ltoChartData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart style={{ outline: "none" }}>
                    <Pie data={ltoChartData} cx="50%" cy="45%"
                      outerRadius={78} innerRadius={28} dataKey="value"
                      paddingAngle={4} labelLine={false} label={PctLabel}>
                      {ltoChartData.map((_, i) => (
                        <Cell key={i} fill={LTO_PIE[i]} stroke={C.p3} strokeWidth={i===0?1:2} />
                      ))}
                    </Pie>
                    <Tooltip content={<Tip />} />
                    <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {ltoChartData.length > 0 && (
                <div className="flex justify-center gap-6 mt-1">
                  <div className="text-center">
                    <p className="text-xl font-black" style={{ color: C.text }}>{stats.updated}</p>
                    <p className="text-[10px] font-medium" style={{ color: C.dark }}>Updated</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black" style={{ color: C.p1 }}>{stats.expired}</p>
                    <p className="text-[10px] font-medium" style={{ color: C.dark }}>Expired</p>
                  </div>
                </div>
              )}
            </ChartCard>
            <ChartCard title="Nature of Business" icon="mdi:briefcase-outline">
              {nobChartData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart style={{ outline: "none" }}>
                    <Pie data={nobChartData} cx="50%" cy="45%"
                      outerRadius={78} innerRadius={28} dataKey="value"
                      paddingAngle={2} labelLine={false} label={PctLabel}>
                      {nobChartData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<Tip />} />
                    <Legend iconType="circle" iconSize={7} formatter={legendFmt} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── ROW 5 — 3D Box Chart: Overall Totals ── */}
      {(() => {
        const grandTotal = stats.retailer + stats.distributor + stats.dealer;
        const pct = v => grandTotal > 0 ? ((v / grandTotal) * 100).toFixed(1) : '0.0';
        const BARS = [
          { label: 'Feed Retailer',    short: 'Retailer',    value: stats.retailer,    color: '#E6789A', light: '#F9C1D3', icon: 'mdi:store-outline' },
          { label: 'Feed Distributor', short: 'Distributor', value: stats.distributor, color: '#9E3560', light: '#D4789A', icon: 'mdi:truck-delivery-outline' },
          { label: 'Feed Dealer',      short: 'Dealer',      value: stats.dealer,      color: '#F5347F', light: '#FF85B0', icon: 'mdi:handshake-outline' },
        ];
        return (
          <div>
            {/* section heading */}
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="mdi:chart-bar" className="text-xl" style={{ color: C.p1 }} />
              <h2 className="text-base font-black" style={{ color: C.text }}>Overall Feed Business Totals (All Provinces)</h2>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-md"
              style={{ background: `linear-gradient(155deg,${C.p4}90 0%,#fff 55%)`, border: `1.5px solid ${C.p2}` }}>

              {/* rainbow top stripe */}
              <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg,#E6789A,#F5347F,#9E3560)` }} />

              <div className="p-6 space-y-6">

                {/* ── header row: title + grand total ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black leading-tight" style={{ color: C.text }}>
                      Feed Business Overview
                    </h3>
                    <p className="text-xs font-medium mt-0.5" style={{ color: C.dark }}>
                      Combined totals across all MIMAROPA provinces
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="rounded-2xl px-5 py-3 shadow-md text-center"
                      style={{ background: `linear-gradient(135deg,${C.p1},${C.text})` }}>
                      <p className="text-[10px] font-bold text-white uppercase tracking-widest opacity-80">Grand Total</p>
                      <p className="text-3xl font-black text-white leading-tight">{grandTotal.toLocaleString()}</p>
                      <p className="text-[10px] text-white opacity-70 font-medium">all categories</p>
                    </div>
                  </div>
                </div>

                {/* ── stat tiles ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {BARS.map(item => (
                    <div key={item.label} className="rounded-2xl overflow-hidden shadow-sm bg-white"
                      style={{ border: `1.5px solid ${item.color}44` }}>
                      {/* colored top bar per tile */}
                      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,${item.light},${item.color})` }} />
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                            style={{ background: `linear-gradient(135deg,${item.light},${item.color})` }}>
                            <Icon icon={item.icon} className="text-white text-xl" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide leading-none" style={{ color: item.color }}>
                              {item.label}
                            </p>
                            <p className="text-3xl font-black leading-tight mt-0.5" style={{ color: C.text }}>
                              {item.value.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {/* percentage row */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold" style={{ color: C.dark }}>Share of total</span>
                          <span className="text-[11px] font-black" style={{ color: item.color }}>{pct(item.value)}%</span>
                        </div>
                        {/* progress bar */}
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: `${item.color}18` }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: `${pct(item.value)}%`,
                              background: `linear-gradient(90deg,${item.light},${item.color})`,
                              transition: 'width 1s ease'
                            }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── 3D bar chart ── */}
                <div className="rounded-2xl p-4"
                  style={{ background: `linear-gradient(180deg,${C.p4}60 0%,#fff 70%)`, border: `1.5px solid ${C.p3}` }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={BARS.map(b => ({ name: b.short, value: b.value, color: b.color }))}
                      margin={{ top: 60, right: 60, left: 10, bottom: 10 }}
                      barCategoryGap="38%"
                      style={{ outline: 'none' }}
                    >
                      <CartesianGrid vertical={false} stroke={C.p3} strokeDasharray="5 5" strokeOpacity={0.55} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={({ x, y, payload, index }) => (
                          <text x={x} y={y + 14} textAnchor="middle"
                            style={{ fontSize: 13, fontWeight: 800, fill: BARS[index]?.color ?? C.text }}>
                            {payload.value}
                          </text>
                        )}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 600, fill: C.dark }}
                        width={38}
                      />
                      <Tooltip
                        cursor={{ fill: C.p4, opacity: 0.3, rx: 8 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          const share = pct(d.value);
                          return (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden"
                              style={{ border: `1.5px solid ${d.color}`, minWidth: 140 }}>
                              <div className="h-1" style={{ background: `linear-gradient(90deg,${C.p3},${d.color})` }} />
                              <div className="px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: d.color }}>{d.name}</p>
                                <p className="text-xl font-black leading-tight mt-0.5" style={{ color: C.text }}>
                                  {d.value.toLocaleString()}
                                </p>
                                <p className="text-[10px] font-semibold mt-1" style={{ color: C.dark }}>
                                  {share}% of total
                                </p>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="value" shape={<Box3DBar />} maxBarSize={120} isAnimationActive>
                        {BARS.map((b, i) => <Cell key={i} fill={b.color} />)}
                        <LabelList
                          dataKey="value"
                          position="top"
                          content={({ x, y, width: w, value, index }) => {
                            const depth = Math.min(w * 0.28, 24);
                            const dY    = depth * 0.5;
                            const col   = BARS[index]?.color ?? C.text;
                            return (
                              <g>
                                {/* connector dot */}
                                <circle cx={x + (w - depth) / 2} cy={y - dY - 4} r={3} fill={col} />
                                {/* dashed line */}
                                <line
                                  x1={x + (w - depth) / 2} y1={y - dY - 8}
                                  x2={x + (w - depth) / 2} y2={y - dY - 26}
                                  stroke={col} strokeWidth={1.5} strokeDasharray="3 2" />
                                {/* value badge */}
                                <rect
                                  x={x + (w - depth) / 2 - 22} y={y - dY - 48}
                                  width={44} height={20}
                                  rx={6} fill={col} />
                                <text
                                  x={x + (w - depth) / 2}
                                  y={y - dY - 34}
                                  textAnchor="middle"
                                  style={{ fontSize: 12, fontWeight: 900, fill: '#fff' }}>
                                  {value.toLocaleString()}
                                </text>
                              </g>
                            );
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ROW 6 — Feed Business Totals (per province) ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="mdi:chart-donut" className="text-xl" style={{ color: C.p1 }} />
          <h2 className="text-base font-black" style={{ color: C.text }}>Feed Retailer / Distributor / Dealer (per province)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {feedBizByProvince.map((p, i) => (
            <ChartCard
              key={p.province}
              title={p.province}
              icon="mdi:map-marker-outline"
            >
              {p.totals.all === 0 ? (
                <EmptyChart />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart style={{ outline: "none" }}>
                      <Pie
                        data={p.data}
                        cx="50%"
                        cy="45%"
                        outerRadius={80}
                        innerRadius={30}
                        dataKey="value"
                        paddingAngle={0}
                        labelLine={false}
                        label={PctLabel}
                      >
                        {p.data.map((d, idx) => (
                          <Cell
                            key={`${p.province}-${d.name}`}
                            fill={['#E6789A', '#7A2648', '#F5347F'][idx] || PIE_COLORS[(i + idx) % PIE_COLORS.length]}
                            stroke="transparent"
                            strokeWidth={0}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<Tip />} />
                      <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { k: 'Retailer',    v: p.totals.retailer,    bg: '#E6789A', fg: '#fff' },
                      { k: 'Distributor', v: p.totals.distributor, bg: '#7A2648', fg: '#fff' },
                      { k: 'Dealer',      v: p.totals.dealer,      bg: '#F5347F', fg: '#fff' },
                    ].map(item => (
                      <div
                        key={item.k}
                        className="rounded-xl px-2 py-2 text-center"
                        style={{ background: item.bg }}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: item.fg }}>{item.k}</p>
                        <p className="text-lg font-black leading-tight" style={{ color: item.fg }}>{item.v.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </ChartCard>
          ))}
        </div>
      </div>

    </div>
  );
}
