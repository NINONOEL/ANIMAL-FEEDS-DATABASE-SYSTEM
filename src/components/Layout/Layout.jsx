import { useState } from 'react';
import Sidebar from './Sidebar';
import Header  from './Header';

const W_OPEN   = 256;
const W_CLOSED = 72;

export default function Layout({ activePage, onNavigate, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarW = collapsed ? W_CLOSED : W_OPEN;

  return (
    <div className="flex min-h-screen" style={{ background: '#FBF7F8' }}>

      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />

      {/* Main area shifts smoothly with the sidebar */}
      <div
        style={{
          marginLeft: sidebarW,
          transition: 'margin-left 0.35s cubic-bezier(0.4,0,0.2,1)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Header activePage={activePage} />
        <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>{children}</main>
      </div>

    </div>
  );
}
