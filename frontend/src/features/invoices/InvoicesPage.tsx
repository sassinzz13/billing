import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { InvoiceTable } from '@/components/InvoiceTable';
import { Card, Input, Pagination, Select } from '@/components/ui';
import { api, qs, type Paged } from '@/lib/api';
import type { InvoiceRow } from '@/types';

export function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['invoices', search, status, page], queryFn: () => api.get<Paged<InvoiceRow>>(`/invoices?${qs({ search, status, page })}`), placeholderData: (p) => p });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <div className="flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search invoice no. or customer" aria-label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <Select className="w-40" aria-label="Status filter" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option><option>Pending</option><option>Paid</option>
        </Select>
      </div>
      <Card>
        <InvoiceTable rows={data?.data} loading={isLoading} />
        {data && <Pagination meta={data.meta} onPage={setPage} />}
      </Card>
    </div>
  );
}
