import type { RequestHandler } from 'express';
import { idParam } from '../../shared/schemas';
import { parse } from '../../shared/validate';
import { generateInvoiceBody, invoiceListQuery } from './schemas';
import { invoiceService as svc } from './service';

export const invoiceController = {
  list: ((req, res) => {
    const { rows, meta } = svc.list(parse(invoiceListQuery, req.query));
    res.json({ data: rows, meta });
  }) as RequestHandler,
  get: ((req, res) => void res.json({ data: svc.get(parse(idParam, req.params.id)) })) as RequestHandler,
  generate: ((req, res) => void res.status(201).json({ data: svc.generate(parse(generateInvoiceBody, req.body).orderId) })) as RequestHandler,
  statusForOrder: ((req, res) => void res.json({ data: svc.statusForOrder(parse(idParam, req.params.orderId)) })) as RequestHandler,
};
