import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Dialog, EmptyRow, Field, Input, Select, SkeletonRows, Td, Th } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { fmtDate, peso } from '@/lib/format';
import type { OrderRow } from '@/types';

interface Customer { id: number; name: string }
interface Product { id: number; name: string; unitPriceCents: number }

/** Stand-in for Sales Management: create an order and confirm it to trigger invoice generation. */
export function OrdersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const orders = useQuery({ queryKey: ['orders'], queryFn: () => api.get<{ data: OrderRow[] }>('/orders').then((r) => r.data) });
  const confirm = useMutation({
    mutationFn: (id: number) => api.post(`/orders/${id}/confirm`),
    onSuccess: () => { toast('ok', 'Order confirmed — invoice generated'); void qc.invalidateQueries(); },
    onError: (e) => toast('err', (e as Error).message),
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Orders</h1><Button onClick={() => setOpen(true)}>New order</Button></div>
      <p className="text-sm text-slate-500">Sales Management stand-in. Confirming an order generates its invoice automatically.</p>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-200 dark:border-slate-800"><tr><Th>Order No.</Th><Th>Customer</Th><Th>Date</Th><Th right>Total</Th><Th>Status</Th><Th /></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.isLoading ? <SkeletonRows cols={6} /> : orders.data?.length ? orders.data.map((o) => (
              <tr key={o.id}>
                <Td className="font-medium">{o.orderNo}</Td><Td>{o.customerName}</Td><Td>{fmtDate(o.createdAt)}</Td><Td right>{peso(o.totalCents)}</Td><Td><Badge status={o.status} /></Td>
                <Td>{o.invoiceId ? <Link className="text-sky-600 hover:underline dark:text-sky-400" to={`/invoices/${o.invoiceId}`}>View invoice</Link> : <Button variant="outline" disabled={confirm.isPending} onClick={() => confirm.mutate(o.id)}>Confirm</Button>}</Td>
              </tr>
            )) : <EmptyRow cols={6} text="No orders yet" />}
          </tbody>
        </table>
      </Card>
      <NewOrderDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function NewOrderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const customers = useQuery({ queryKey: ['customers'], queryFn: () => api.get<{ data: Customer[] }>('/customers').then((r) => r.data), enabled: open });
  const products = useQuery({ queryKey: ['products'], queryFn: () => api.get<{ data: Product[] }>('/products').then((r) => r.data), enabled: open });
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('1');
  const m = useMutation({
    mutationFn: () => api.post('/orders', { customerId: Number(customerId), items: [{ productId: Number(productId), quantity: Number(qty) }] }),
    onSuccess: () => { toast('ok', 'Order created'); void qc.invalidateQueries({ queryKey: ['orders'] }); onClose(); },
    onError: (e) => toast('err', (e as Error).message),
  });
  const valid = customerId && productId && Number.isInteger(Number(qty)) && Number(qty) >= 1;
  return (
    <Dialog open={open} title="New order" onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valid) m.mutate(); }}>
        <Field label="Customer"><Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Select…</option>{customers.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Product"><Select value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Select…</option>{products.data?.map((p) => <option key={p.id} value={p.id}>{p.name} — {peso(p.unitPriceCents)}</option>)}</Select></Field>
        <Field label="Quantity"><Input type="number" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!valid || m.isPending}>Create</Button></div>
      </form>
    </Dialog>
  );
}
