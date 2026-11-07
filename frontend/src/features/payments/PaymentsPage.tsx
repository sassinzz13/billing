import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, EmptyRow, Input, Pagination, SkeletonRows, Td, Th } from '@/components/ui';
import { api, qs, type Paged } from '@/lib/api';
import { fmtDate, peso } from '@/lib/format';
import type { PaymentRow } from '@/types';

export function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['payments', search, page], queryFn: () => api.get<Paged<PaymentRow>>(`/payments?${qs({ search, page })}`), placeholderData: (p) => p });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Payments</h1>
      <Input className="max-w-xs" placeholder="Search invoice no. or reference" aria-label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-slate-200 dark:border-slate-800"><tr><Th>Payment ID</Th><Th>Invoice No.</Th><Th>Date</Th><Th right>Amount</Th><Th>Method</Th><Th>Reference</Th><Th>Recorded by</Th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? <SkeletonRows cols={7} /> : data?.data.length ? data.data.map((p) => (
                <tr key={p.id}><Td>#{p.id}</Td><Td><Link className="text-sky-600 hover:underline dark:text-sky-400" to={`/invoices/${p.invoiceId}`}>{p.invoiceNo}</Link></Td><Td>{fmtDate(p.paymentDate)}</Td><Td right>{peso(p.amountCents)}</Td><Td>{p.method}</Td><Td>{p.referenceNo ?? '—'}</Td><Td>{p.recordedBy}</Td></tr>
              )) : <EmptyRow cols={7} text="No payments found" />}
            </tbody>
          </table>
        </div>
        {data && <Pagination meta={data.meta} onPage={setPage} />}
      </Card>
    </div>
  );
}
