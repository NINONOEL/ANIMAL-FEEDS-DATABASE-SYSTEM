import { Icon } from '@iconify/react';
import { createPortal } from 'react-dom';
import { C } from '../../data/colors';

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, confirmLabel = 'Delete' }) {
  if (!isOpen) return null;
  const dialogNode = (
    <div
      className="fixed inset-0 z-[80] w-screen h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: `rgba(${hexRgb(C.deep)},0.45)`,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">

        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: C.p4 }}>
          <Icon icon="mdi:alert-circle-outline" className="text-3xl" style={{ color: C.p1 }} />
        </div>

        <h3 className="text-base font-bold text-center mb-2" style={{ color: C.text }}>{title}</h3>
        <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: C.p2 }}>{message}</p>

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white transition-colors"
            style={{ border: `1px solid ${C.p3}`, color: C.p1 }}
            onMouseEnter={e => e.currentTarget.style.background = C.bg}
            onMouseLeave={e => e.currentTarget.style.background = C.white}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${C.p1}, ${C.deep})` }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogNode, document.body);
}

function hexRgb(hex) { return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(','); }
