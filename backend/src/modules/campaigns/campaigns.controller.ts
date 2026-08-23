import type { Request, Response } from 'express';
import { z } from 'zod';
import type {
    AnalyzeAnnouncementRequest,
    UpdateCampaignRequest,
} from '@root-shared/types/campaign.js';
import {
    analyzeAndCreateDraft,
    listCampaigns,
    getCampaignById,
    getCampaignRecipients,
    deleteCampaign,
    cancelCampaign,
    updateCampaign,
    getTargetContext,
    approveCampaign,
} from './campaigns.service.js';
import { BadRequestError } from '@shared/error/index.js';

const analyzeRequestSchema: z.ZodType<AnalyzeAnnouncementRequest> = z.object({
    prompt: z.string().min(1),
    scheduledAt: z
        .string()
        .nullable()
        .refine(
            (value) =>
                value === null ||
                (Number.isFinite(Date.parse(value)) && new Date(value) > new Date()),
            {
                message:
                    'scheduledAt must be a parseable ISO-8601 date/time in the future',
            },
        ),
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

export async function handleCancelCampaign(req: Request, res: Response): Promise<void> {
    const parsed = uuidSchema.safeParse(req.params.id);
    if (!parsed.success) throw new BadRequestError('Invalid campaign id');

    const campaign = await cancelCampaign(parsed.data);
    res.status(200).json(campaign);
}

export async function handleGetTargetContext(
    _req: Request,
    res: Response,
): Promise<void> {
    const ctx = await getTargetContext();
    res.status(200).json(ctx);
}

const updateCampaignSchema = z.object({
    title: z.string().min(1).optional(),
    priority: z.enum(['normal', 'important', 'critical']).optional(),
    channels: z.array(z.enum(['email', 'teams', 'mobile_push'])).optional(),
    targeting: z
        .array(
            z.array(
                z.object({
                    type: z.enum(['group', 'location']),
                    name: z.string().min(1),
                }),
            ),
        )
        .optional(),
    scheduled_at: z
        .string()
        .nullable()
        .optional()
        .refine(
            (value) =>
                value === undefined ||
                value === null ||
                (Number.isFinite(Date.parse(value)) && new Date(value) > new Date()),
            {
                message:
                    'scheduled_at must be a parseable ISO-8601 date/time in the future',
            },
        ),
    teams_message: z.string().nullable().optional(),
    email_subject: z.string().nullable().optional(),
    email_body: z.string().nullable().optional(),
    notification_text: z.string().nullable().optional(),
});

export async function handleUpdateCampaign(req: Request, res: Response): Promise<void> {
    const idParsed = uuidSchema.safeParse(req.params.id);
    if (!idParsed.success) throw new BadRequestError('Invalid campaign id');

    const bodyParsed = updateCampaignSchema.safeParse(req.body);
    if (!bodyParsed.success) {
        const msg = bodyParsed.error.issues.map((i) => i.message).join(', ');
        throw new BadRequestError(`Invalid update payload: ${msg}`);
    }

    const campaign = await updateCampaign(
        idParsed.data,
        bodyParsed.data as UpdateCampaignRequest,
    );
    res.status(200).json(campaign);
}

export async function handleApproveCampaign(req: Request, res: Response): Promise<void> {
    const idParsed = uuidSchema.safeParse(req.params.id);
    if (!idParsed.success) throw new BadRequestError('Invalid campaign id');

    const userId = res.locals.userId as string;
    const campaign = await approveCampaign(idParsed.data, userId);
    res.status(200).json(campaign);
}
