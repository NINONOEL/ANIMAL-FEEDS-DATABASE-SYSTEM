import { Icon } from '@iconify/react';
import { C } from '../../data/colors';

const NAV_ITEMS = [
  { id: 'summary', label: 'MIMAROPA Summary',  icon: 'mdi:view-dashboard-outline' },
  { id: 'records', label: 'Animal Feeds Records', icon: 'mdi:database-outline' },
];

const W_OPEN   = 256;
const W_CLOSED = 72;

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle }) {
  const sidebarW = collapsed ? W_CLOSED : W_OPEN;

  return (
    <>
      {/* ── Sidebar panel ── */}
      <aside
        style={{
          position: 'fixed',
          left: 0, top: 0,
          height: '100%',
          width: sidebarW,
          background: `linear-gradient(180deg, ${C.p1} 0%, ${C.dark} 45%, ${C.deep} 100%)`,
          transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}
      >

        {/* ── Logo + Title ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          padding: collapsed ? '20px 8px 16px' : '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.18)',
          flexShrink: 0,
          transition: 'padding 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Logo */}
          <div style={{
            width: collapsed ? 44 : 80,
            height: collapsed ? 44 : 80,
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 3,
            flexShrink: 0,
            transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <img src="/DALOGO.jpg" alt="DA" style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:'50%' }} />
          </div>

          {/* Text block — fades out when collapsed */}
          <div style={{
            textAlign: 'center',
            overflow: 'hidden',
            opacity: collapsed ? 0 : 1,
            maxHeight: collapsed ? 0 : 80,
            transition: 'opacity 0.25s ease, max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
            whiteSpace: 'nowrap',
          }}>
            <p style={{ color:'white', fontSize: 10, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>
              Department of Agriculture
            </p>
            <p style={{ color:'white', fontSize: 12, fontWeight: 900, textTransform:'uppercase', letterSpacing:'0.08em', margin:'2px 0 0' }}>
              MIMAROPA Region
            </p>
            <div style={{ height: 1.5, width: 48, background:'rgba(255,255,255,0.45)', margin:'6px auto 4px', borderRadius: 2 }} />
            <p style={{ color:'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>
              Animal Feeds Database
            </p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{
          flex: 1,
          padding: '12px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}>
          {NAV_ITEMS.map(item => {
            const active = activePage === item.id;
            return collapsed ? (
              /* ── COLLAPSED: perfectly centered 44×44 icon box ── */
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: active ? '1px solid rgba(255,255,255,0.35)' : '1px solid transparent',
                  background: active ? 'rgba(255,255,255,0.22)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon icon={item.icon} style={{ fontSize: 22, color: 'white' }} />
              </button>
            ) : (
              /* ── EXPANDED: full-width row with icon + label ── */
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  width: 'calc(100% - 16px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: active ? '1px solid rgba(255,255,255,0.30)' : '1px solid transparent',
                  background: active ? 'rgba(255,255,255,0.22)' : 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'rgba(255,255,255,0.22)' : 'transparent'; }}
              >
                <Icon icon={item.icon} style={{ fontSize: 22, flexShrink: 0, color: 'white' }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.10)',
          padding: '12px 0',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
        }}>
          {collapsed ? (
            /* collapsed: perfectly centered DA logo icon */
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon icon="mdi:leaf-circle-outline" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 22 }} />
            </div>
          ) : (
            /* expanded: full text block */
            <div style={{
              width: 'calc(100% - 28px)',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '8px 12px',
              textAlign: 'center',
            }}>
              <p style={{ color:'rgba(255,255,255,0.75)', fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.09em', margin:0, lineHeight:1.6 }}>
                DA-MIMAROPA Animal Feeds<br />Regulatory Division
              </p>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:9, marginTop:4 }}>
                © {new Date().getFullYear()}
              </p>
            </div>
          )}
        </div>

      </aside>

      {/* ── Toggle button — fixed on the right edge of the sidebar, always same position ── */}
      <button
        onClick={onToggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'fixed',
          top: '50%',
          transform: 'translateY(-50%)',
          left: sidebarW - 14,   /* sits half-outside the sidebar edge */
          zIndex: 50,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.p1}, ${C.deep})`,
          border: '2px solid white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.20)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.35s cubic-bezier(0.4,0,0.2,1), background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(135deg, ${C.dark}, ${C.deep})`}
        onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(135deg, ${C.p1}, ${C.deep})`}
      >
        <Icon
          icon={collapsed ? 'mdi:chevron-right' : 'mdi:chevron-left'}
          style={{ fontSize: 16 }}
        />
      </button>
    </>
  );
}
