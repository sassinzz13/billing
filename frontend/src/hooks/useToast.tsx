import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface T { id: number; kind: 'ok' | 'err'; text: string }
const Ctx = createContext<(kind: T['kind'], text: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((kind: T['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, kind, text }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="no-print fixed bottom-4 right-4 z-50 space-y-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cn('max-w-sm rounded-lg px-4 py-3 text-sm text-white shadow-lg', t.kind === 'ok' ? 'bg-emerald-600' : 'bg-red-600')}>{t.text}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
