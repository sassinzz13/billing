import { Router } from 'express';
import { parse } from '../../shared/validate';
import { createPaymentBody, paymentListQuery } from './schemas';
import { paymentService as svc } from './service';

export const paymentRouter = Router();
paymentRouter.get('/', (req, res) => {
  const q = parse(paymentListQuery, req.query);
  const { rows, meta } = svc.list(q.page, q.pageSize, q.search);
  res.json({ data: rows, meta });
});
paymentRouter.post('/', (req, res) => void res.status(201).json({ data: svc.record(parse(createPaymentBody, req.body), req.user!) }));
