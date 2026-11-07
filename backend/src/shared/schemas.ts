import { z } from 'zod';

/** Reusable zod building blocks. */
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine((s) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}, 'Invalid date');
export const cents = z.number().int('Must be a whole number of centavos').min(0).max(100_000_000_000);
export const positiveCents = cents.min(1, 'Must be greater than zero');
export const idParam = z.coerce.number().int().positive();
export const optionalText = (max = 500) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null));
export const paymentMethod = z.enum(['cash', 'gcash', 'maya', 'bank_transfer', 'other']);

export const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().trim().max(100).optional(),
  sort: z.string().max(40).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
