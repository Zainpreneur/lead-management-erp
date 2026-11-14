'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';
interface ToastItem { id: number; title: string; description?: string; variant: ToastVariant; }

const ToastContext = React.createContext<{ add: (t: Omit<ToastItem, 'id'>) => void } | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-slate-200 bg-white text-slate-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-emerald-600" />,
  error: <AlertCircle className="h-5 w-5 text-rose-600" />,
  info: <Info className="h-5 w-5 text-slate-600" />,
  warning: <AlertCircle className="h-5 w-5 text-amber-600" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const add = React.useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  const remove = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ add }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-5',
              variantStyles[t.variant]
            )}
          >
            {variantIcons[t.variant]}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{t.title}</div>
              {t.description && <div className="mt-0.5 text-xs opacity-80">{t.description}</div>}
            </div>
            <button onClick={() => remove(t.id)} className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}