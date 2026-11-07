import type { z } from 'zod';
import { AppError } from './errors';

export function parse<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    const first = details[0];
    throw new AppError(400, 'VALIDATION_ERROR', first ? `${first.path ? first.path + ': ' : ''}${first.message}` : 'Invalid request', details);
  }
  return result.data;
}
