import { Router } from 'express';
import {
    analyzeCampaign,
    handleListCampaigns,
    handleGetCampaign,
    handleGetRecipients,
    handleDeleteCampaign,
    handleCancelCampaign,
    handleUpdateCampaign,
    handleGetTargetContext,
} from './campaigns.controller.js';
import { requireAuth, requireRole } from '@shared/middleware/auth.middleware.js';

export const campaignsRoutes = Router();

campaignsRoutes.get('/target-context', requireAuth, requireRole('admin', 'sender'), handleGetTargetContext);
campaignsRoutes.get('/', requireAuth, requireRole('admin', 'sender'), handleListCampaigns);
campaignsRoutes.get('/:id', requireAuth, requireRole('admin', 'sender'), handleGetCampaign);
campaignsRoutes.get('/:id/recipients', requireAuth, requireRole('admin', 'sender'), handleGetRecipients);
campaignsRoutes.post('/analyze', requireAuth, requireRole('admin', 'sender'), analyzeCampaign);
campaignsRoutes.patch('/:id', requireAuth, requireRole('admin', 'sender'), handleUpdateCampaign);
campaignsRoutes.delete('/:id', requireAuth, requireRole('admin', 'sender'), handleDeleteCampaign);
campaignsRoutes.patch('/:id/cancel', requireAuth, requireRole('admin', 'sender'), handleCancelCampaign);
