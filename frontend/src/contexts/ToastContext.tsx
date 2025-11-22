/**
 * Toast Notification System
 * Provides app-wide toast notifications for user feedback
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, WarningCircle, Info, X } from '@phosphor-icons/react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: Toast['type'], message: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-soft-lg border animate-fade-in-up ${
            toast.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : toast.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-brand-500/10 border-brand-500/30 text-brand-400'
          }`}
        >
          {toast.type === 'success' && <CheckCircle size={20} weight="fill" />}
          {toast.type === 'error' && <WarningCircle size={20} weight="fill" />}
          {toast.type === 'info' && <Info size={20} weight="fill" />}

          <span className="flex-1 text-sm font-medium">{toast.message}</span>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      ))}
    </div>
  );
}
