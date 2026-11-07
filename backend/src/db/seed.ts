import { getDb } from './client';
import { customers, products } from './schema';

/** Dummy Sales/Product data so the Finance flow can be exercised end to end. Idempotent. */
export function seedDemoData(): void {
  const db = getDb();
  if (db.select().from(customers).limit(1).all().length === 0) {
    db.insert(customers).values([
      { name: 'Juan Dela Cruz', email: 'juan@example.com', phone: '0917 000 0001', address: '12 Rizal St, Quezon City' },
      { name: 'Maria Santos', email: 'maria@example.com', phone: '0917 000 0002', address: '45 Mabini Ave, Makati' },
      { name: 'Pacific Traders Inc.', email: 'accounts@pacific.example', phone: '02 8000 0003', address: '8 Roxas Blvd, Pasay' },
    ]).run();
  }
  if (db.select().from(products).limit(1).all().length === 0) {
    db.insert(products).values([
      { name: 'Office Chair', unitPriceCents: 250000 },
      { name: 'Standing Desk', unitPriceCents: 800000 },
      { name: 'Wireless Keyboard', unitPriceCents: 120000 },
      { name: 'LED Monitor 24"', unitPriceCents: 450000 },
    ]).run();
  }
}
