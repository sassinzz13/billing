import { z } from 'zod';
import { isoDate, listQuery, positiveCents } from '../../shared/schemas';

export const METHODS = ['Cash', 'Bank Transfer', 'E-Wallet', 'Card'] as const;
export const createPaymentBody = z
  .object({
    invoiceId: z.number().int().positive(),
    amountCents: positiveCents.refine((n) => n > 0, 'Amount must be greater than 0'),
    method: z.enum(METHODS, { error: 'Payment method is required' }),
    referenceNo: z.string().trim().max(50).nullish().transform((v) => v || null),
    paymentDate: isoDate,
  })
  .refine((v) => v.method === 'Cash' || !!v.referenceNo, { path: ['referenceNo'], message: 'Reference number is required for Bank Transfer, E-Wallet and Card' });
export const paymentListQuery = listQuery;
export type CreatePaymentBody = z.output<typeof createPaymentBody>;
