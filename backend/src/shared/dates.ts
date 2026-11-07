const pad = (n: number) => String(n).padStart(2, '0');
export const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Today in the server's local timezone as YYYY-MM-DD. */
export const todayLocal = () => fmtDate(new Date());
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return fmtDate(new Date(y!, m! - 1, d! + days));
}
export const nowIso = () => new Date().toISOString();

export interface Range {
  from: string;
  to: string;
}
/** Resolve a named period into an inclusive date range. */
export function resolveRange(period: string, from?: string, to?: string, today = todayLocal()): Range {
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  switch (period) {
    case 'daily':
      return { from: today, to: today };
    case 'weekly': {
      const start = new Date(dt);
      start.setDate(dt.getDate() - ((dt.getDay() + 6) % 7)); // Monday
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { from: fmtDate(start), to: fmtDate(end) };
    }
    case 'yearly':
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    case 'custom':
      if (from && to) return { from, to };
      return resolveRange('monthly', undefined, undefined, today);
    case 'monthly':
    default: {
      const last = new Date(y!, m!, 0).getDate();
      return { from: `${y}-${pad(m!)}-01`, to: `${y}-${pad(m!)}-${pad(last)}` };
    }
  }
}
