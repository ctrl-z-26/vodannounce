import { Router } from 'express';
import { analyzeCampaign } from './campaigns.controller.js';
import { requireAuth, requireRole } from '@shared/middleware/auth.middleware.js';

export const campaignsRoutes = Router();

campaignsRoutes.post('/analyze', requireAuth, requireRole('admin', 'sender'), analyzeCampaign);
