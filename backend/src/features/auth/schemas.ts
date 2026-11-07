import { z } from 'zod';

const password = z.string().min(8, 'At least 8 characters').max(128);
export const setupSchema = z.object({
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/, 'Letters, numbers, . _ - only'),
  password,
  setupKey: z.string().max(200).optional(),
});
export const loginSchema = z.object({ username: z.string().trim().min(1).max(40), password: z.string().min(1).max(128) });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: password });
