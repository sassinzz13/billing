import { X } from 'lucide-react';
import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Button({ variant = 'primary', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'danger' }) {
  const v = {
    primary: 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300',
    outline: 'border border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800',
    ghost: 'hover:bg-slate-200/70 dark:hover:bg-slate-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant];
  return <button {...p} className={cn('inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:pointer-events-none disabled:opacity-50', v, className)} />;
}
const field = 'h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-900';
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(field, p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cn(field, p.className)} />;
export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p} className={cn('rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900', className)} />;
export const Skeleton = ({ className }: { className?: string }) => <div className={cn('animate-pulse rounded-md bg-slate-200 dark:bg-slate-800', className)} />;

export function Badge({ status }: { status: 'Pending' | 'Paid' | 'Confirmed' }) {
  const c = status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : status === 'Confirmed' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  return <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', c)}>{status}</span>;
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error && <span role="alert" className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Dialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} className="m-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      {open && (
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function Pagination({ meta, onPage }: { meta: { page: number; totalPages: number; total: number }; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
      <span className="text-slate-500">{meta.total} record{meta.total === 1 ? '' : 's'}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</Button>
        <span>Page {meta.page} of {meta.totalPages}</span>
        <Button variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export const Th = ({ children, right }: { children?: ReactNode; right?: boolean }) => <th className={cn('px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500', right ? 'text-right' : 'text-left')}>{children}</th>;
export const Td = ({ children, right, className }: { children?: ReactNode; right?: boolean; className?: string }) => <td className={cn('px-4 py-3 text-sm', right && 'text-right tabular-nums', className)}>{children}</td>;
export const EmptyRow = ({ cols, text }: { cols: number; text: string }) => <tr><td colSpan={cols} className="px-4 py-12 text-center text-sm text-slate-500">{text}</td></tr>;
export const SkeletonRows = ({ cols }: { cols: number }) => <>{[0, 1, 2, 3].map((i) => <tr key={i}><td colSpan={cols} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td></tr>)}</>;
