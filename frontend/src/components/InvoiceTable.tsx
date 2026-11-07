import { Link } from 'react-router-dom';
import { Badge, EmptyRow, SkeletonRows, Td, Th } from '@/components/ui';
import { fmtDate, peso } from '@/lib/format';
import type { InvoiceRow } from '@/types';

export function InvoiceTable({ rows, loading, empty = 'No invoices found' }: { rows?: InvoiceRow[]; loading: boolean; empty?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px]">
        <thead className="border-b border-slate-200 dark:border-slate-800">
          <tr><Th>Invoice No.</Th><Th>Order No.</Th><Th>Customer</Th><Th>Date</Th><Th right>Total</Th><Th right>Paid</Th><Th right>Balance</Th><Th>Status</Th><Th /></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? <SkeletonRows cols={9} /> : rows?.length ? rows.map((i) => (
            <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <Td className="font-medium">{i.invoiceNo}</Td><Td>{i.orderNo}</Td><Td>{i.customerName}</Td><Td>{fmtDate(i.invoiceDate)}</Td>
              <Td right>{peso(i.totalCents)}</Td><Td right>{peso(i.amountPaidCents)}</Td><Td right>{peso(i.balanceCents)}</Td>
              <Td><Badge status={i.status} /></Td>
              <Td><Link className="text-sky-600 hover:underline dark:text-sky-400" to={`/invoices/${i.id}`}>View</Link></Td>
            </tr>
          )) : <EmptyRow cols={9} text={empty} />}
        </tbody>
      </table>
    </div>
  );
}
