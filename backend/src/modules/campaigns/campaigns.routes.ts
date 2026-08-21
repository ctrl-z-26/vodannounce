import { Router } from 'express';
import { analyzeCampaign } from './campaigns.controller.js';

export const campaignsRoutes = Router();

campaignsRoutes.post('/analyze', analyzeCampaign);
