import { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { C } from '../data/colors';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const startRemoveToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => removeToast(id), 240);
  }, [removeToast]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, leaving: false }]);
    setTimeout(() => startRemoveToast(id), 3200);
  }, [startRemoveToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id}
            className={`toast-item ${toast.leaving ? 'toast-leave' : 'toast-enter'} flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium min-w-[260px] max-w-sm`}
            style={{ background: `linear-gradient(135deg, ${C.p1}, ${C.deep})` }}>
            <Icon icon={toast.type === 'error' ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline'}
              className="text-lg flex-shrink-0" style={{ color: C.p4 }} />
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => startRemoveToast(toast.id)}
              className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
