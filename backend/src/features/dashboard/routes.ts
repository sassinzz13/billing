import { Router } from 'express';
import { dashboardService } from './service';

export const dashboardRouter = Router();
dashboardRouter.get('/', (_req, res) => void res.json({ data: dashboardService.summary() }));
