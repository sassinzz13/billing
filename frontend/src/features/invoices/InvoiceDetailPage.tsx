import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, EmptyRow, Skeleton, Td, Th } from '@/components/ui';
import { RecordPaymentDialog } from '@/features/payments/RecordPaymentDialog';
import { useAuth } from '@/features/auth/AuthProvider';
import { api } from '@/lib/api';
import { fmtDate, peso } from '@/lib/format';
import type { InvoiceDetail } from '@/types';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey: ['invoice', id], queryFn: () => api.get<{ data: InvoiceDetail }>(`/invoices/${id}`).then((r) => r.data) });
  if (isLoading) return <Skeleton className="h-96" />;
  if (error || !data) return <p role="alert" className="text-sm text-red-600">{(error as Error)?.message ?? 'Not found'}</p>;
  const { invoice: inv, customer, items, payments } = data;
  return (
    <div className="space-y-5">
      <Link to="/invoices" className="no-print text-sm text-sky-600 hover:underline dark:text-sky-400">← Invoices</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><h1 className="text-2xl font-semibold">{inv.invoiceNo}</h1><Badge status={inv.status} /></div>
        <div className="no-print flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer size={16} />Print</Button>
          {user?.role === 'finance' && inv.status === 'Pending' && <Button onClick={() => setOpen(true)}>Record Payment</Button>}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-1 p-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</div>
          <div className="font-medium">{customer.name}</div>
          {[customer.address, customer.phone, customer.email].filter(Boolean).map((l) => <div key={l} className="text-slate-500">{l}</div>)}
        </Card>
        <Card className="space-y-1 p-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Details</div>
          <div>Order: <span className="font-medium">{inv.orderNo}</span></div>
          <div>Invoice date: {fmtDate(inv.invoiceDate)}</div>
        </Card>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead className="border-b border-slate-200 dark:border-slate-800"><tr><Th>Item</Th><Th right>Qty</Th><Th right>Unit price</Th><Th right>Amount</Th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((i) => <tr key={i.id}><Td>{i.productName}</Td><Td right>{i.quantity}</Td><Td right>{peso(i.unitPriceCents)}</Td><Td right>{peso(i.lineTotalCents)}</Td></tr>)}
          </tbody>
          <tfoot className="border-t border-slate-200 text-sm dark:border-slate-800">
            <tr><Td right className="font-medium" /><Td /><Td right>Total</Td><Td right className="font-semibold">{peso(inv.totalCents)}</Td></tr>
            <tr><Td /><Td /><Td right>Paid</Td><Td right>{peso(inv.amountPaidCents)}</Td></tr>
            <tr><Td /><Td /><Td right>Balance</Td><Td right className="font-semibold">{peso(inv.balanceCents)}</Td></tr>
          </tfoot>
        </table>
      </Card>
      <Card className="overflow-x-auto">
        <div className="border-b border-slate-200 px-4 py-3 font-medium dark:border-slate-800">Payment history</div>
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-slate-200 dark:border-slate-800"><tr><Th>Date</Th><Th right>Amount</Th><Th>Method</Th><Th>Reference</Th><Th>Recorded by</Th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.length ? payments.map((p) => <tr key={p.id}><Td>{fmtDate(p.paymentDate)}</Td><Td right>{peso(p.amountCents)}</Td><Td>{p.method}</Td><Td>{p.referenceNo ?? '—'}</Td><Td>{p.recordedBy}</Td></tr>) : <EmptyRow cols={5} text="No payments recorded yet" />}
          </tbody>
        </table>
      </Card>
      <RecordPaymentDialog open={open} onClose={() => setOpen(false)} invoice={inv} />
    </div>
  );
}
