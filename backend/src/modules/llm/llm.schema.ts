import { z } from 'zod';
import type { Target } from '@root-shared/types/campaign.js';

/**
 * Zod validation for a single auditable target, bound to the shared
 * `Target` type so backend and frontend always agree on the target shape.
 */
export const targetSchema: z.ZodType<Target> = z.object({
    type: z.enum(['group', 'location']),
    name: z.string().min(1),
});

/**
 * Zod schema for Gemini's structured campaign analysis output.
 *
 * `targets` is a DNF expression: the outer array is an OR (union) of cells,
 * each inner array an AND (intersection) across its targets. A location target
 * is expanded to its footprint groups at resolution time.
 */
export const campaignAnalysisSchema = z.object({
    title: z.string().min(1),
    priority: z.enum(['normal', 'important', 'critical']),
    channels: z.array(z.enum(['email', 'teams', 'mobile_push'])).min(1),
    email_subject: z.string().min(1),
    email_body: z.string().min(1),
    notification_text: z.string().max(500),
    teams_message: z.string().nullable(),
    targets: z.array(z.array(targetSchema)).min(1),
});

export type CampaignAnalysis = z.infer<typeof campaignAnalysisSchema>;