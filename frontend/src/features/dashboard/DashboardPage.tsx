import { useQuery } from '@tanstack/react-query';
import { InvoiceTable } from '@/components/InvoiceTable';
import { Card, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { peso } from '@/lib/format';
import type { Dashboard } from '@/types';

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<{ data: Dashboard }>('/dashboard').then((r) => r.data) });
  const cards = data && [
    ['Total Invoices', String(data.totalInvoices)],
    ['Paid', String(data.paidInvoices)],
    ['Pending', String(data.pendingInvoices)],
    ['Total Collected', peso(data.totalCollectedCents)],
    ['Total Receivable', peso(data.totalReceivableCents)],
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Finance Dashboard</h1>
      {error && <p role="alert" className="text-sm text-red-600">{(error as Error).message}</p>}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {isLoading ? [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />) : cards?.map(([l, v]) => (
          <Card key={l} className="p-4"><div className="text-xs font-medium uppercase tracking-wide text-slate-500">{l}</div><div className="mt-2 text-xl font-semibold tabular-nums">{v}</div></Card>
        ))}
      </div>
      <Card>
        <div className="border-b border-slate-200 px-4 py-3 font-medium dark:border-slate-800">Latest invoices</div>
        <InvoiceTable rows={data?.latest} loading={isLoading} empty="No invoices yet. Confirm an order to generate one." />
      </Card>
    </div>
  );
}
