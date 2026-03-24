import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRecords } from '../hooks/useRecords';
import { PROVINCES, NATURE_OF_BUSINESS_TYPES } from '../data/constants';
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
          <p className="text-xs font-medium leading-tight truncate" style={{ color: C.p1 }}>{label}</p>
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

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden"
      style={{ background: C.white, border: `1.5px solid ${STRONG_BORDER}` }}>

      {/* header */}
      <div className="px-4 py-3 text-white flex items-center justify-between"
        style={{ background: headerGrad }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white">Province</p>
          <p className="text-sm font-bold leading-tight">{province}</p>
        </div>
        <div className="text-right">
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

/* ── main ──────────────────────────────────────────────────── */
export default function SummaryPage() {
  const { records, loading } = useRecords();

  const stats = useMemo(() => ({
    total:       records.length,
    retailer:    records.reduce((s, r) => s + (Number(r.feedRetailer)    || 0), 0),
    distributor: records.reduce((s, r) => s + (Number(r.feedDistributor) || 0), 0),
    dealer:      records.reduce((s, r) => s + (Number(r.feedDealer)      || 0), 0),
    newReg:      records.filter(r => r.registration === 'new').length,
    renew:       records.filter(r => r.registration === 'renew').length,
    updated:     records.filter(r => r.lto === 'updated').length,
    expired:     records.filter(r => r.lto === 'expired').length,
  }), [records]);

  const byProvince = useMemo(() =>
    PROVINCES.map(p => ({ province: p, records: records.filter(r => r.province === p) })),
  [records]);

  const provinceChartData = byProvince
    .map(p => ({ name: p.province.replace(' Mindoro',''), value: p.records.length }))
    .filter(d => d.value > 0);

  const regChartData = [
    { name:'New',   value: stats.newReg },
    { name:'Renew', value: stats.renew  },
  ].filter(d => d.value > 0);

  const ltoChartData = [
    { name:'Updated', value: stats.updated },
    { name:'Expired', value: stats.expired },
  ].filter(d => d.value > 0);

  const nobChartData = useMemo(() =>
    NATURE_OF_BUSINESS_TYPES
      .map(n => ({ name: n.short, value: records.reduce((s, r) => s + (Number(r[n.key]) || 0), 0) }))
      .filter(d => d.value > 0),
  [records]);

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
            Real-time data · Expiration: December 31 annually
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

      {/* ── ROW 4 — Pie Charts ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="mdi:chart-pie" className="text-xl" style={{ color: C.p1 }} />
          <h2 className="text-base font-black" style={{ color: C.text }}>Charts & Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          <ChartCard title="By Province" icon="mdi:map-outline">
            {provinceChartData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
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
                <PieChart>
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
                <PieChart>
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
                <PieChart>
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
    </div>
  );
}
