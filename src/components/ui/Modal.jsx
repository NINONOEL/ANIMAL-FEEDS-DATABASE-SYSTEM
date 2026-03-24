import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { createPortal } from 'react-dom';
import { C } from '../../data/colors';

export default function Modal({ isOpen, onClose, title, subtitle, size = 'lg', children }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl', '2xl':'max-w-6xl' }[size] || 'max-w-2xl';

  const modalNode = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-hidden"
      style={{
        backgroundColor: `rgba(${hexRgb(C.deep)},0.38)`,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClass} max-h-[90vh] flex flex-col overflow-hidden`}>

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl"
          style={{ background: `linear-gradient(135deg, ${C.p1}, ${C.deep})`, borderBottom: `1px solid ${C.p3}` }}>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-xs leading-tight mt-0.5" style={{ color: C.p4 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors hover:bg-white hover:bg-opacity-20">
            <Icon icon="mdi:close" className="text-lg" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

function hexRgb(hex) {
  return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',');
}
