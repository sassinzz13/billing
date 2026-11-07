import { Router } from 'express';
import { invoiceController as c } from './controller';

export const invoiceRouter = Router();
invoiceRouter.get('/', c.list);
invoiceRouter.post('/', c.generate);
invoiceRouter.get('/by-order/:orderId', c.statusForOrder);
invoiceRouter.get('/:id', c.get);
