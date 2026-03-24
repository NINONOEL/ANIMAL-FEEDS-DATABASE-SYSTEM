import { Icon } from '@iconify/react';
import { C } from '../../data/colors';

const PAGE_META = {
  summary: { title: 'MIMAROPA Dashboard',        subtitle: 'Animal Feeds Overview — MIMAROPA Region', icon: 'mdi:view-dashboard-outline' },
  records: { title: 'Animal Feeds Records',       subtitle: 'Manage individual establishment records',        icon: 'mdi:database-outline' },
};

export default function Header({ activePage }) {
  const meta  = PAGE_META[activePage] || PAGE_META.summary;
  const today = new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm" style={{ borderBottom: `1px solid ${C.p3}` }}>
      <div className="flex items-center justify-between px-6 py-3.5">

        {/* Page title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${C.p1}, ${C.deep})` }}>
            <Icon icon={meta.icon} className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight" style={{ color: C.text }}>{meta.title}</h1>
            <p className="text-xs leading-tight" style={{ color: C.p2 }}>{meta.subtitle}</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs" style={{ color: C.p2 }}>
            <Icon icon="mdi:calendar-outline" style={{ color: C.p2 }} className="text-sm" />
            <span>{today}</span>
          </div>
          <div className="w-px h-6" style={{ background: C.p3 }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.p1}, ${C.deep})` }}>
              <Icon icon="mdi:account" className="text-white text-base" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold leading-tight" style={{ color: C.text }}>Admin</p>
              <p className="text-[10px] leading-tight" style={{ color: C.p2 }}>DA-MIMAROPA</p>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
