import { eq } from 'drizzle-orm';
import { getDb } from '../../db/client';
import { invoices, payments } from '../../db/schema';
import { todayLocal } from '../../shared/dates';
import { AppError, conflict, unprocessable } from '../../shared/errors';
import { pageMeta } from '../../shared/pagination';
import { invoiceRepository } from '../invoices/repository';
import type { AuthUser } from '../auth/types';
import { paymentRepository as repo } from './repository';
import type { CreatePaymentBody } from './schemas';

const peso = (c: number) => (c / 100).toFixed(2);

export const paymentService = {
  list: (page: number, pageSize: number, search?: string) => {
    const { rows, total } = repo.list(page, pageSize, search);
    return { rows, meta: pageMeta(page, pageSize, total) };
  },

  /** FR-04/05, rules 3-9. Everything happens in one transaction so balance and status never drift. */
  record(b: CreatePaymentBody, user: AuthUser) {
    if (user.role !== 'finance') throw new AppError(403, 'FORBIDDEN', 'Only Finance users can record payments');
    return getDb().transaction((tx) => {
      const inv = invoiceRepository.raw(b.invoiceId, tx);
      if (!inv) throw unprocessable('Invoice does not exist');
      if (inv.status === 'Paid') throw conflict('Invoice already paid');
      if (b.amountCents > inv.balanceCents) throw unprocessable(`Amount exceeds balance of ₱${peso(inv.balanceCents)}`, { balanceCents: inv.balanceCents });
      if (b.paymentDate > todayLocal()) throw unprocessable('Payment date cannot be in the future');
      const pay = tx.insert(payments).values({ invoiceId: inv.id, paymentDate: b.paymentDate, amountCents: b.amountCents, method: b.method, referenceNo: b.referenceNo, recordedBy: user.id }).returning().get();
      const paid = inv.amountPaidCents + b.amountCents;
      const balance = inv.totalCents - paid;
      tx.update(invoices).set({ amountPaidCents: paid, balanceCents: balance, status: balance === 0 ? 'Paid' : 'Pending' }).where(eq(invoices.id, inv.id)).run();
      return { payment: pay, invoice: invoiceRepository.raw(inv.id, tx)! };
    });
  },
};
