import { z } from 'zod';
import { listQuery } from '../../shared/schemas';

export const generateInvoiceBody = z.object({ orderId: z.number().int().positive() });
export const invoiceListQuery = listQuery.extend({ status: z.enum(['Pending', 'Paid']).optional() });
export type InvoiceListQuery = z.output<typeof invoiceListQuery>;
