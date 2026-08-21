import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AnalyzeAnnouncementRequest } from '@root-shared/types/campaign.js';
import {
    analyzeAndCreateDraft,
    listCampaigns,
    getCampaignById,
    getCampaignRecipients,
} from './campaigns.service.js';

const analyzeRequestSchema: z.ZodType<AnalyzeAnnouncementRequest> = z.object({
    prompt: z.string().min(1),
    scheduledAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
        message: 'scheduledAt must be a parseable ISO-8601 date/time',
    }),
});

const uuidSchema = z.uuid();

export async function analyzeCampaign(req: Request, res: Response): Promise<void> {
    const parsed = analyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            error: 'Invalid request body',
            details: z.treeifyError(parsed.error),
        });
        return;
    }
    try {
        const userId = res.locals.userId as string;
        const campaign = await analyzeAndCreateDraft(parsed.data, userId);
        res.status(201).json(campaign);
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
}

export async function handleListCampaigns(_req: Request, res: Response): Promise<void> {
    try {
        const campaigns = await listCampaigns();
        res.status(200).json(campaigns);
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
}

export async function handleGetCampaign(req: Request, res: Response): Promise<void> {
    const parsed = uuidSchema.safeParse(req.params.id);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid campaign id' });
        return;
    }
    try {
        const campaign = await getCampaignById(parsed.data);
        res.status(200).json(campaign);
    } catch (error) {
        res.status(404).json({
            error: error instanceof Error ? error.message : 'Campaign not found',
        });
    }
}

export async function handleGetRecipients(req: Request, res: Response): Promise<void> {
    const parsed = uuidSchema.safeParse(req.params.id);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid campaign id' });
        return;
    }
    try {
        const recipients = await getCampaignRecipients(parsed.data);
        res.status(200).json(recipients);
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
}
