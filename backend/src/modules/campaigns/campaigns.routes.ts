import { Router } from 'express';
import {
    analyzeCampaign,
    handleListCampaigns,
    handleGetCampaign,
    handleGetRecipients,
} from './campaigns.controller.js';
import { requireAuth, requireRole } from '@shared/middleware/auth.middleware.js';

export const campaignsRoutes = Router();

campaignsRoutes.get('/', requireAuth, requireRole('admin', 'sender'), handleListCampaigns);
campaignsRoutes.get('/:id', requireAuth, requireRole('admin', 'sender'), handleGetCampaign);
campaignsRoutes.get('/:id/recipients', requireAuth, requireRole('admin', 'sender'), handleGetRecipients);
campaignsRoutes.post('/analyze', requireAuth, requireRole('admin', 'sender'), analyzeCampaign);
