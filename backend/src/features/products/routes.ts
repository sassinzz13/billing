import { Router } from 'express';
import { asc } from 'drizzle-orm';
import { getDb } from '../../db/client';
import { products } from '../../db/schema';

export const productRouter = Router();
productRouter.get('/', (_req, res) => void res.json({ data: getDb().select().from(products).orderBy(asc(products.name)).all() }));
