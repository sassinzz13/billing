import { desc, eq, or, sql } from 'drizzle-orm';
import { getDb } from '../../db/client';
import { customers, invoices, payments, users } from '../../db/schema';
import { likePattern, offsetOf } from '../../shared/pagination';

export const paymentRepository = {
  /** FR-07: newest first. */
  list(page: number, pageSize: number, search?: string) {
    const p = search ? likePattern(search) : null;
    const cond = p ? or(sql`${invoices.invoiceNo} like ${p} escape '\\'`, sql`${payments.referenceNo} like ${p} escape '\\'`) : undefined;
    const rows = getDb()
      .select({ id: payments.id, invoiceId: payments.invoiceId, invoiceNo: invoices.invoiceNo, customerName: customers.name, paymentDate: payments.paymentDate, amountCents: payments.amountCents, method: payments.method, referenceNo: payments.referenceNo, recordedBy: users.username })
      .from(payments)
      .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
      .innerJoin(customers, eq(customers.id, invoices.customerId))
      .innerJoin(users, eq(users.id, payments.recordedBy))
      .where(cond)
      .orderBy(desc(payments.paymentDate), desc(payments.id))
      .limit(pageSize)
      .offset(offsetOf(page, pageSize))
      .all();
    const total = getDb().select({ n: sql<number>`count(*)` }).from(payments).innerJoin(invoices, eq(invoices.id, payments.invoiceId)).where(cond).get()!.n;
    return { rows, total };
  },
};
