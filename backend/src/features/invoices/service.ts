import { eq } from 'drizzle-orm';
import { getDb, type Tx } from '../../db/client';
import { invoices, orders } from '../../db/schema';
import { todayLocal } from '../../shared/dates';
import { conflict, notFound, unprocessable } from '../../shared/errors';
import { pageMeta } from '../../shared/pagination';
import { invoiceRepository as repo } from './repository';
import type { InvoiceListQuery } from './schemas';

/** FR-01 / rules 1-2: one invoice per Confirmed order, copying customer and order total. Initial status Pending. */
export function generateInvoiceForOrder(tx: Tx, orderId: number) {
  const order = tx.select().from(orders).where(eq(orders.id, orderId)).get();
  if (!order) throw notFound('Order');
  if (order.status !== 'Confirmed') throw unprocessable('Only confirmed orders can be invoiced');
  if (repo.byOrder(orderId, tx)) throw conflict('Order already invoiced');
  const date = todayLocal();
  const year = date.slice(0, 4);
  const last = repo.lastNumberForYear(year, tx);
  const seq = last ? Number(last.split('-')[2]) + 1 : 1;
  return tx
    .insert(invoices)
    .values({
      invoiceNo: `INV-${year}-${String(seq).padStart(4, '0')}`,
      orderId,
      customerId: order.customerId,
      invoiceDate: date,
      totalCents: order.totalCents,
      amountPaidCents: 0,
      balanceCents: order.totalCents,
      status: order.totalCents === 0 ? 'Paid' : 'Pending',
    })
    .returning()
    .get();
}

export const invoiceService = {
  list(q: InvoiceListQuery) {
    const { rows, total } = repo.list(q);
    return { rows, meta: pageMeta(q.page, q.pageSize, total) };
  },
  generate(orderId: number) {
    const inv = getDb().transaction((tx) => generateInvoiceForOrder(tx, orderId));
    return this.get(inv.id);
  },
  get(id: number) {
    const invoice = repo.get(id);
    if (!invoice) throw notFound('Invoice');
    return { invoice, customer: repo.customer(invoice.customerId), items: repo.items(invoice.orderId), payments: repo.payments(id) };
  },
  /** Integration: Finance -> Shipment. */
  statusForOrder(orderId: number) {
    const inv = repo.byOrder(orderId);
    if (!inv) throw notFound('Invoice for this order');
    return { orderId, invoiceNo: inv.invoiceNo, status: inv.status };
  },
};
