import { Router } from 'express';
import { asc } from 'drizzle-orm';
import { getDb } from '../../db/client';
import { customers } from '../../db/schema';

export const customerRouter = Router();
customerRouter.get('/', (_req, res) => void res.json({ data: getDb().select().from(customers).orderBy(asc(customers.name)).all() }));
