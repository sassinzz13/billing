import { z } from 'zod';
export const createOrderBody = z.object({
  customerId: z.number().int().positive(),
  items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(100000) })).min(1, 'Add at least one item').max(100),
});
