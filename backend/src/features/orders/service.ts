import { desc, eq } from 'drizzle-orm';
import { getDb } from '../../db/client';
import { customers, orderItems, orders, products } from '../../db/schema';
import { conflict, notFound, unprocessable } from '../../shared/errors';
import { generateInvoiceForOrder } from '../invoices/service';
import { invoiceRepository } from '../invoices/repository';
import type { z } from 'zod';
import type { createOrderBody } from './schemas';

export const orderService = {
  list: () =>
    getDb()
      .select({ id: orders.id, orderNo: orders.orderNo, customerName: customers.name, status: orders.status, totalCents: orders.totalCents, createdAt: orders.createdAt })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .orderBy(desc(orders.id))
      .all()
      .map((o) => ({ ...o, invoiceId: invoiceRepository.byOrder(o.id)?.id ?? null })),

  create(b: z.output<typeof createOrderBody>) {
    return getDb().transaction((tx) => {
      if (!tx.select().from(customers).where(eq(customers.id, b.customerId)).get()) throw unprocessable('Customer does not exist');
      const lines = b.items.map((i) => {
        const p = tx.select().from(products).where(eq(products.id, i.productId)).get();
        if (!p) throw unprocessable(`Product #${i.productId} does not exist`);
        return { productId: p.id, productName: p.name, quantity: i.quantity, unitPriceCents: p.unitPriceCents, lineTotalCents: p.unitPriceCents * i.quantity };
      });
      const next = (tx.select({ id: orders.id }).from(orders).orderBy(desc(orders.id)).limit(1).get()?.id ?? 0) + 1;
      const o = tx.insert(orders).values({ orderNo: `ORD-${String(next).padStart(4, '0')}`, customerId: b.customerId, totalCents: lines.reduce((a, l) => a + l.lineTotalCents, 0) }).returning().get();
      for (const l of lines) tx.insert(orderItems).values({ ...l, orderId: o.id }).run();
      return o;
    });
  },

  /** Sales confirms the order; Finance immediately generates the invoice (FR-01) in the same transaction. */
  confirm(id: number) {
    return getDb().transaction((tx) => {
      const o = tx.select().from(orders).where(eq(orders.id, id)).get();
      if (!o) throw notFound('Order');
      if (o.status === 'Confirmed') throw conflict('Order already confirmed and invoiced');
      tx.update(orders).set({ status: 'Confirmed', confirmedAt: new Date().toISOString() }).where(eq(orders.id, id)).run();
      return generateInvoiceForOrder(tx, id);
    });
  },
};
