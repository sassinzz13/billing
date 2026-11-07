import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'billing-')), 'test.db');
process.env.LOGIN_RATE_LIMIT = '1000';

let agent: ReturnType<typeof request.agent>;
let app: import('express').Express;
const today = new Date().toISOString().slice(0, 10);
const pay = (invoiceId: number, amountCents: number, method = 'Cash', referenceNo?: string) =>
  agent.post('/api/payments').send({ invoiceId, amountCents, method, referenceNo, paymentDate: today });

async function newInvoice(qty: number, productId = 1) {
  const o = await agent.post('/api/orders').send({ customerId: 1, items: [{ productId, quantity: qty }] });
  const c = await agent.post(`/api/orders/${o.body.data.id}/confirm`);
  return { order: o.body.data, invoice: c.body.data };
}

beforeAll(async () => {
  const { initDb } = await import('../src/db/client');
  const { seedDemoData } = await import('../src/db/seed');
  const { createApp } = await import('../src/app');
  initDb();
  seedDemoData();
  app = createApp();
  agent = request.agent(app);
});
afterAll(async () => (await import('../src/db/client')).closeDb());

describe('auth', () => {
  it('requires login, supports setup once, hashes with argon2id, sets httpOnly cookie', async () => {
    expect((await request(app).get('/api/invoices')).status).toBe(401);
    const r = await agent.post('/api/auth/setup').send({ username: 'finance', password: 'password123' });
    expect(r.status).toBe(201);
    expect(r.headers['set-cookie']![0]).toMatch(/HttpOnly/i);
    expect((await request(app).post('/api/auth/setup').send({ username: 'x2x', password: 'password123' })).status).toBe(409);
    const { getSqlite } = await import('../src/db/client');
    expect((getSqlite().prepare('select password_hash h from users').get() as { h: string }).h).toMatch(/^\$argon2id\$/);
    expect((await agent.get('/api/invoices')).status).toBe(200);
  });
  it('rejects bad login', async () => {
    expect((await request(app).post('/api/auth/login').send({ username: 'finance', password: 'wrong-pass' })).status).toBe(401);
  });
});

describe('FR / TC scenarios (invoice of ₱5,000)', () => {
  let invId: number;
  let orderId: number;

  it('TC-01 confirming an order creates INV-YYYY-0001, balance 5000, Pending', async () => {
    await newInvoice(2, 3); // an extra Pending invoice of ₱2,400 (2 keyboards) for the dashboard case
    const { order, invoice } = await newInvoice(2, 1); // 2 x ₱2,500 chairs = ₱5,000
    orderId = order.id;
    invId = invoice.id;
    expect(invoice.invoiceNo).toMatch(/^INV-\d{4}-\d{4}$/);
    expect(invoice.totalCents).toBe(500000);
    expect(invoice.balanceCents).toBe(500000);
    expect(invoice.status).toBe('Pending');
  });
  it('TC-02 duplicate invoice blocked', async () => {
    const r = await agent.post('/api/invoices').send({ orderId });
    expect(r.status).toBe(409);
    expect(r.body.error.message).toMatch(/already invoiced/);
    expect((await agent.post(`/api/orders/${orderId}/confirm`)).status).toBe(409);
  });
  it('only confirmed orders can be invoiced (rule 1)', async () => {
    const o = await agent.post('/api/orders').send({ customerId: 1, items: [{ productId: 1, quantity: 1 }] });
    expect((await agent.post('/api/invoices').send({ orderId: o.body.data.id })).status).toBe(422);
  });
  it('TC-06 zero amount rejected', async () => {
    const r = await pay(invId, 0);
    expect(r.status).toBe(400);
  });
  it('TC-07 bank transfer needs a reference', async () => {
    const r = await pay(invId, 10000, 'Bank Transfer');
    expect(r.status).toBe(400);
    expect(r.body.error.message).toMatch(/Reference number is required/);
  });
  it('TC-05 overpayment blocked', async () => {
    const r = await pay(invId, 600000);
    expect(r.status).toBe(422);
    expect(r.body.error.message).toMatch(/exceeds balance/);
  });
  it('TC-03 partial payment: paid 2000, balance 3000, Pending', async () => {
    const r = await pay(invId, 200000);
    expect(r.status).toBe(201);
    expect(r.body.data.invoice).toMatchObject({ amountPaidCents: 200000, balanceCents: 300000, status: 'Pending' });
  });
  it('TC-04 final payment by E-Wallet: balance 0, Paid', async () => {
    const r = await pay(invId, 300000, 'E-Wallet', 'EW-123');
    expect(r.body.data.invoice).toMatchObject({ balanceCents: 0, status: 'Paid' });
  });
  it('TC-08 payment on a paid invoice rejected', async () => {
    const r = await pay(invId, 10000);
    expect(r.status).toBe(409);
    expect(r.body.error.message).toMatch(/already paid/);
  });
  it('FR-03 detail shows items and full payment history; Finance->Shipment status', async () => {
    const d = await agent.get(`/api/invoices/${invId}`);
    expect(d.body.data.payments).toHaveLength(2);
    expect(d.body.data.items.length).toBeGreaterThan(0);
    expect((await agent.get(`/api/invoices/by-order/${orderId}`)).body.data.status).toBe('Paid');
  });
  it('FR-07 payment history is newest first and searchable', async () => {
    const all = await agent.get('/api/payments');
    expect(all.body.data[0].referenceNo).toBe('EW-123');
    expect((await agent.get('/api/payments?search=EW-123')).body.data).toHaveLength(1);
  });
  it('TC-09 dashboard counts: total 3, paid 1, pending 2', async () => {
    // currently: invoices #1 (helper pre-created, Pending), #2 (the 5000 one, Paid). Add a third pending.
    await newInvoice(1);
    const d = (await agent.get('/api/dashboard')).body.data;
    expect(d).toMatchObject({ totalInvoices: 3, paidInvoices: 1, pendingInvoices: 2, totalCollectedCents: 500000 });
    expect(d.totalReceivableCents).toBe(240000 + 250000);
    expect((await agent.get('/api/invoices?status=Paid')).body.data).toHaveLength(1);
  });
  it('invoice numbers are sequential and unique', async () => {
    const list = (await agent.get('/api/invoices?pageSize=50')).body.data.map((i: { invoiceNo: string }) => i.invoiceNo).sort();
    expect(new Set(list).size).toBe(list.length);
    expect(list[0]).toMatch(/-0001$/);
    expect(list[2]).toMatch(/-0003$/);
  });
});

describe('authorization', () => {
  it('rule 9: non-finance users cannot record payments', async () => {
    const { getSqlite } = await import('../src/db/client');
    const { hash } = await import('@node-rs/argon2');
    getSqlite().prepare("insert into users (username, password_hash, role) values ('clerk', ?, 'staff')").run(await hash('password123', { algorithm: 2 }));
    const staff = request.agent(app);
    await staff.post('/api/auth/login').send({ username: 'clerk', password: 'password123' }).expect(200);
    const inv = (await agent.get('/api/invoices?status=Pending')).body.data[0];
    const r = await staff.post('/api/payments').send({ invoiceId: inv.id, amountCents: 100, method: 'Cash', paymentDate: today });
    expect(r.status).toBe(403);
  });
});

