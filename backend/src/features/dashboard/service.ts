import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from '../../db/client';
import { customers, invoices, orders } from '../../db/schema';

/** FR-06. All figures are computed from invoice rows. */
export const dashboardService = {
  summary() {
    const db = getDb();
    const s = db
      .select({
        total: sql<number>`count(*)`,
        paid: sql<number>`coalesce(sum(${invoices.status} = 'Paid'),0)`,
        pending: sql<number>`coalesce(sum(${invoices.status} = 'Pending'),0)`,
        collected: sql<number>`coalesce(sum(${invoices.amountPaidCents}),0)`,
        receivable: sql<number>`coalesce(sum(${invoices.balanceCents}),0)`,
      })
      .from(invoices)
      .get()!;
    const latest = db
      .select({ id: invoices.id, invoiceNo: invoices.invoiceNo, orderNo: orders.orderNo, customerName: customers.name, invoiceDate: invoices.invoiceDate, totalCents: invoices.totalCents, amountPaidCents: invoices.amountPaidCents, balanceCents: invoices.balanceCents, status: invoices.status })
      .from(invoices)
      .innerJoin(orders, eq(orders.id, invoices.orderId))
      .innerJoin(customers, eq(customers.id, invoices.customerId))
      .orderBy(desc(invoices.id))
      .limit(5)
      .all();
    return { totalInvoices: s.total, paidInvoices: s.paid, pendingInvoices: s.pending, totalCollectedCents: s.collected, totalReceivableCents: s.receivable, latest };
  },
};
