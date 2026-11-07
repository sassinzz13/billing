import { CreditCard, FileText, LayoutDashboard, LogOut, Moon, ShoppingCart, Sun } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.theme = next ? 'dark' : 'light'; } catch { /* ignore */ }
    setDark(next);
  };
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="no-print flex shrink-0 flex-col border-b border-slate-200 bg-white p-3 md:w-60 md:border-b-0 md:border-r dark:border-slate-800 dark:bg-slate-900">
        <div className="px-2 py-2 text-base font-semibold">AyanoERP <span className="font-normal text-slate-500">Finance</span></div>
        <nav className="mt-2 flex gap-1 overflow-x-auto md:flex-col" aria-label="Main">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}>
              <Icon size={17} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 md:mt-auto md:pt-6 dark:border-slate-800">
          <div className="px-3 text-xs text-slate-500">{user?.username} · {user?.role}</div>
          <button onClick={toggle} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{dark ? <Sun size={17} /> : <Moon size={17} />}{dark ? 'Light mode' : 'Dark mode'}</button>
          <button onClick={() => void logout()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><LogOut size={17} />Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
