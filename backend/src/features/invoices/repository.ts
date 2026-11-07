import { and, desc, eq, like, or, sql, type SQL } from 'drizzle-orm';
import { getDb, type Db, type Tx } from '../../db/client';
import { customers, invoices, orderItems, orders, payments, users } from '../../db/schema';
import { likePattern, offsetOf } from '../../shared/pagination';
import type { InvoiceListQuery } from './schemas';

type Conn = Db | Tx;
const listCols = {
  id: invoices.id,
  invoiceNo: invoices.invoiceNo,
  orderId: invoices.orderId,
  orderNo: orders.orderNo,
  customerId: invoices.customerId,
  customerName: customers.name,
  invoiceDate: invoices.invoiceDate,
  totalCents: invoices.totalCents,
  amountPaidCents: invoices.amountPaidCents,
  balanceCents: invoices.balanceCents,
  status: invoices.status,
};
const base = (c: Conn) => c.select(listCols).from(invoices).innerJoin(orders, eq(orders.id, invoices.orderId)).innerJoin(customers, eq(customers.id, invoices.customerId));

export const invoiceRepository = {
  list(q: InvoiceListQuery) {
    const where: (SQL | undefined)[] = [];
    if (q.status) where.push(eq(invoices.status, q.status));
    if (q.search) {
      const p = likePattern(q.search);
      where.push(or(sql`${invoices.invoiceNo} like ${p} escape '\\'`, sql`${customers.name} like ${p} escape '\\'`, sql`${orders.orderNo} like ${p} escape '\\'`));
    }
    const cond = and(...where);
    const rows = base(getDb()).where(cond).orderBy(desc(invoices.id)).limit(q.pageSize).offset(offsetOf(q.page, q.pageSize)).all();
    const total = getDb().select({ n: sql<number>`count(*)` }).from(invoices).innerJoin(orders, eq(orders.id, invoices.orderId)).innerJoin(customers, eq(customers.id, invoices.customerId)).where(cond).get()!.n;
    return { rows, total };
  },
  get: (id: number, c: Conn = getDb()) => base(c).where(eq(invoices.id, id)).get(),
  raw: (id: number, c: Conn = getDb()) => c.select().from(invoices).where(eq(invoices.id, id)).get(),
  byOrder: (orderId: number, c: Conn = getDb()) => c.select().from(invoices).where(eq(invoices.orderId, orderId)).get(),
  customer: (id: number) => getDb().select().from(customers).where(eq(customers.id, id)).get(),
  items: (orderId: number) => getDb().select().from(orderItems).where(eq(orderItems.orderId, orderId)).all(),
  payments: (invoiceId: number) =>
    getDb()
      .select({ id: payments.id, paymentDate: payments.paymentDate, amountCents: payments.amountCents, method: payments.method, referenceNo: payments.referenceNo, recordedBy: users.username, createdAt: payments.createdAt })
      .from(payments)
      .innerJoin(users, eq(users.id, payments.recordedBy))
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.paymentDate), desc(payments.id))
      .all(),
  lastNumberForYear(year: string, c: Conn): string | undefined {
    return c.select({ n: invoices.invoiceNo }).from(invoices).where(like(invoices.invoiceNo, `INV-${year}-%`)).orderBy(desc(invoices.invoiceNo)).limit(1).get()?.n;
  },
};
