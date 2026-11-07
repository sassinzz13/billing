import { Router } from 'express';
import { idParam } from '../../shared/schemas';
import { parse } from '../../shared/validate';
import { createOrderBody } from './schemas';
import { orderService as svc } from './service';

export const orderRouter = Router();
orderRouter.get('/', (_req, res) => void res.json({ data: svc.list() }));
orderRouter.post('/', (req, res) => void res.status(201).json({ data: svc.create(parse(createOrderBody, req.body)) }));
orderRouter.post('/:id/confirm', (req, res) => void res.json({ data: svc.confirm(parse(idParam, req.params.id)) }));
