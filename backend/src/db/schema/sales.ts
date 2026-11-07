import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createdAt } from './_common';

/** Dummy backend data owned by Sales/Product subsystems; Finance only reads it. */
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  createdAt: createdAt(),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
});

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderNo: text('order_no').notNull().unique(),
    customerId: integer('customer_id').notNull().references(() => customers.id),
    status: text('status', { enum: ['Pending', 'Confirmed'] }).notNull().default('Pending'),
    totalCents: integer('total_cents').notNull().default(0),
    confirmedAt: text('confirmed_at'),
    createdAt: createdAt(),
  },
  (t) => [index('orders_customer_idx').on(t.customerId)],
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id').notNull().references(() => products.id),
    productName: text('product_name').notNull(),
    quantity: integer('quantity').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
    lineTotalCents: integer('line_total_cents').notNull(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)],
);
