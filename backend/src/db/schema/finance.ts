import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createdAt } from './_common';
import { customers, orders } from './sales';
import { users } from './users';

/** Money is stored as integer centavos (exact), displayed as pesos. */
export const invoices = sqliteTable(
  'invoices',
  {
    id: integer('invoice_id').primaryKey({ autoIncrement: true }),
    invoiceNo: text('invoice_no').notNull().unique(), // INV-2026-0001
    orderId: integer('order_id').notNull().unique().references(() => orders.id), // one invoice per order
    customerId: integer('customer_id').notNull().references(() => customers.id),
    invoiceDate: text('invoice_date').notNull(),
    totalCents: integer('total_amount').notNull(),
    amountPaidCents: integer('amount_paid').notNull().default(0),
    balanceCents: integer('balance').notNull(),
    status: text('status', { enum: ['Pending', 'Paid'] }).notNull().default('Pending'),
    createdAt: createdAt(),
  },
  (t) => [
    index('invoices_customer_idx').on(t.customerId),
    index('invoices_status_idx').on(t.status),
    check('invoices_consistent', sql`${t.totalCents} >= 0 AND ${t.amountPaidCents} >= 0 AND ${t.amountPaidCents} <= ${t.totalCents} AND ${t.balanceCents} = ${t.totalCents} - ${t.amountPaidCents}`),
  ],
);

export const payments = sqliteTable(
  'payments',
  {
    id: integer('payment_id').primaryKey({ autoIncrement: true }),
    invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
    paymentDate: text('payment_date').notNull(),
    amountCents: integer('amount').notNull(),
    method: text('payment_method', { enum: ['Cash', 'Bank Transfer', 'E-Wallet', 'Card'] }).notNull(),
    referenceNo: text('reference_no'),
    recordedBy: integer('recorded_by').notNull().references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [index('payments_invoice_idx').on(t.invoiceId), index('payments_date_idx').on(t.paymentDate), check('payments_amount_pos', sql`${t.amountCents} > 0`)],
);
