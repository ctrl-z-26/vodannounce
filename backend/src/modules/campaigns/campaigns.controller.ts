import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AnalyzeAnnouncementRequest } from '@root-shared/types/campaign.js';
import {
    analyzeAndCreateDraft,
    listCampaigns,
    getCampaignById,
    getCampaignRecipients,
    deleteCampaign,
} from './campaigns.service.js';
import { BadRequestError } from '@shared/error/index.js';

const analyzeRequestSchema: z.ZodType<AnalyzeAnnouncementRequest> = z.object({
    prompt: z.string().min(1),
    scheduledAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
        message: 'scheduledAt must be a parseable ISO-8601 date/time',
    }),
});

const uuidSchema = z.uuid();

export async function analyzeCampaign(req: Request, res: Response): Promise<void> {
    const parsed = analyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError('Invalid request body');

    const userId = res.locals.userId as string;
    const campaign = await analyzeAndCreateDraft(parsed.data, userId);
    res.status(201).json(campaign);
}

export async function handleListCampaigns(_req: Request, res: Response): Promise<void> {
    const campaigns = await listCampaigns();
    res.status(200).json(campaigns);
}

export async function handleGetCampaign(req: Request, res: Response): Promise<void> {
    const parsed = uuidSchema.safeParse(req.params.id);
    if (!parsed.success) throw new BadRequestError('Invalid campaign id');

    const campaign = await getCampaignById(parsed.data);
    res.status(200).json(campaign);
}

export async function handleGetRecipients(req: Request, res: Response): Promise<void> {
    const parsed = uuidSchema.safeParse(req.params.id);
    if (!parsed.success) throw new BadRequestError('Invalid campaign id');

    const recipients = await getCampaignRecipients(parsed.data);
    res.status(200).json(recipients);
}

export async function handleDeleteCampaign(req: Request, res: Response): Promise<void> {
    const parsed = uuidSchema.safeParse(req.params.id);
    if (!parsed.success) throw new BadRequestError('Invalid campaign id');

    await deleteCampaign(parsed.data);
    res.status(204).send();
}
