import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AnalyzeAnnouncementRequest } from '@root-shared/types/campaign.js';
import { analyzeAndCreateDraft } from './campaigns.service.js';

const analyzeRequestSchema: z.ZodType<AnalyzeAnnouncementRequest> = z.object({
    prompt: z.string().min(1),
    scheduledAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
        message: 'scheduledAt must be a parseable ISO-8601 date/time',
    }),
});

export async function analyzeCampaign(req: Request, res: Response): Promise<void> {
    const parsed = analyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request body', details: z.treeifyError(parsed.error) });
        return;
    }
    try {
        const userId = res.locals.userId as string;
        const campaign = await analyzeAndCreateDraft(parsed.data, userId);
        res.status(201).json(campaign);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
}
