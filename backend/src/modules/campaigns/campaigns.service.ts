import { env } from '@shared/config/env.js';

import {
    resolveTeamsDestinations,
} from '../teams/teams-destinations.service.js';

import {
    sendTeamsChannelMessage,
} from '../teams/teams.service.js';

import { supabase } from '@shared/supabase/supabase.js';
import type { Database } from '@shared/supabase/database.types.js';
import type {
    AnalyzeAnnouncementRequest,
    Campaign,
    CampaignRecipient,
    TargetContext,
    TargetingExpression,
    UpdateCampaignRequest,
} from '@root-shared/types/campaign.js';
import { analyzeAnnouncement, repairTargets } from '../llm/index.js';
import type { CampaignAnalysis } from '../llm/index.js';
import { findUnknownTargets, resolveAudience } from './campaigns.utils.js';
import { pushToUsers } from '../fcm/index.js';
import { BadRequestError, NotFoundError } from '@shared/error/index.js';

/** Number of AI target-repair attempts allowed after the initial analysis. */
const MAX_REPAIRS = 2;

/**
 * Fetches the exact group/location names Gemini may reference as targets.
 */
export async function getTargetContext(): Promise<TargetContext> {
    const [groupsResult, locationsResult] = await Promise.all([
        supabase.from('groups').select('name, description'),
        supabase.from('locations').select('name'),
    ]);
    if (groupsResult.error)
        throw new Error(`Failed to fetch groups: ${groupsResult.error.message}`);
    if (locationsResult.error) {
        throw new Error(`Failed to fetch locations: ${locationsResult.error.message}`);
    }
    return {
        groups: [
            { name: 'All', description: 'All employees' },
            ...groupsResult.data.map((row) => ({
                name: row.name,
                description: row.description,
            })),
        ],
        locations: locationsResult.data.map((row) => row.name),
    };
}

/**
 * Runs AI analysis on a raw announcement prompt and persists the result as a
 * draft announcement plus its audit log.
 *
 * When Gemini returns target names that do not exist in the database, they are
 * repaired via a corrective follow-up call (up to {@link MAX_REPAIRS} times)
 * that returns corrected targets only; valid content fields stay untouched.
 *
 * @param request - The manager's prompt and scheduled date per the shared contract.
 * @param userId - Creating manager's profile id; null until JWT auth middleware lands.
 * @returns The persisted draft as the shared {@link Campaign} DTO.
 * @throws When targets remain invalid after all repairs or a database write fails.
 */
export async function analyzeAndCreateDraft(
    request: AnalyzeAnnouncementRequest,
    userId: string | null,
): Promise<Campaign> {
    const targetContext = await getTargetContext();
    let analysis: CampaignAnalysis = await analyzeAnnouncement(
        request.prompt,
        targetContext,
    );

    for (let attempt = 0; attempt < MAX_REPAIRS; attempt += 1) {
        const unknown = findUnknownTargets(analysis.targets, targetContext);
        if (unknown.length === 0) break;
        const targets = await repairTargets(
            request.prompt,
            analysis,
            unknown,
            targetContext,
        );
        analysis = { ...analysis, targets };
    }

    const remaining = findUnknownTargets(analysis.targets, targetContext);
    if (remaining.length > 0) {
        throw new BadRequestError(
            `AI produced unknown targets after ${MAX_REPAIRS} repair attempts: ${remaining.join(', ')}`,
        );
    }

    const { targets, ...content } = analysis;
    const draft: Database['public']['Tables']['announcements']['Insert'] = {
        ...content,
        targeting: targets,
        original_text: request.prompt,
        scheduled_at: request.scheduledAt,
        status: 'draft',
        teams_channel_ids: null,
        created_by: userId,
    };
    const { data, error } = await supabase
        .from('announcements')
        .insert(draft)
        .select()
        .single();
    if (error || !data)
        throw new Error(`Failed to create draft announcement: ${error?.message}`);

    const log: Database['public']['Tables']['announcement_logs']['Insert'] = {
        announcement_id: data.id,
        action: 'created',
        user_id: userId,
    };
    const { error: logError } = await supabase.from('announcement_logs').insert(log);
    if (logError) throw new Error(`Failed to write audit log: ${logError.message}`);

    // campaign.lock.ts proves Row ≡ Campaign outside the jsonb targeting
    // field, so this is the only conversion at the database boundary.
    return data as Campaign;
}

/**
 * Returns all announcements ordered by creation date (newest first).
 */
export async function listCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to list campaigns: ${error.message}`);
    return data as Campaign[];
}

/**
 * Returns a single announcement by id.
 *
 * @throws When the announcement does not exist or the query fails.
 */
export async function getCampaignById(id: string): Promise<Campaign> {
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();
    if (error || !data) throw new NotFoundError('Campaign');
    return data as Campaign;
}

/**
 * Returns all recipient records for a given announcement, enriched with
 * the user's display name and group memberships (departments).
 */
export async function getCampaignRecipients(
    campaignId: string,
): Promise<CampaignRecipient[]> {
    const { data: recipients, error } = await supabase
        .from('announcement_recipients')
        .select('*, profiles(full_name)')
        .eq('announcement_id', campaignId);
    if (error) throw new Error(`Failed to fetch recipients: ${error.message}`);
    if (!recipients?.length) return [];

    const userIds = recipients.map((r) => r.user_id);
    const { data: memberships } = await supabase
        .from('group_members')
        .select('user_id, groups(name)')
        .in('user_id', userIds);

    const deptMap = new Map<string, string[]>();
    for (const m of memberships ?? []) {
        const name = (m.groups as { name: string } | null)?.name;
        if (!name) continue;
        const depts = deptMap.get(m.user_id) ?? [];
        depts.push(name);
        deptMap.set(m.user_id, depts);
    }

    return recipients.map((r) => ({
        ...r,
        full_name: (r.profiles as { full_name: string | null } | null)?.full_name ?? null,
        departments: deptMap.get(r.user_id) ?? [],
    }));
}

/**
 * Cancels a scheduled campaign by setting its status to 'cancelled' and
 * inserting an audit log entry.
 *
 * Only campaigns with status 'scheduled' can be cancelled.
 *
 * @param id - The campaign UUID to cancel.
 * @returns The updated campaign with status set to 'cancelled'.
 * @throws NotFoundError when the campaign does not exist.
 * @throws BadRequestError when the campaign is not in scheduled status.
 */
export async function cancelCampaign(id: string): Promise<Campaign> {
    const { data: campaign, error: fetchError } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !campaign) throw new NotFoundError('Campaign');
    if (campaign.status !== 'scheduled') {
        throw new BadRequestError('Only scheduled campaigns can be cancelled');
    }

    const { error: updateError } = await supabase
        .from('announcements')
        .update({ status: 'cancelled' })
        .eq('id', id);
    if (updateError) throw new Error(`Failed to cancel campaign: ${updateError.message}`);

    const log: Database['public']['Tables']['announcement_logs']['Insert'] = {
        announcement_id: id,
        action: 'cancelled',
        user_id: campaign.created_by,
    };
    const { error: logError } = await supabase.from('announcement_logs').insert(log);
    if (logError) throw new Error(`Failed to write audit log: ${logError.message}`);

    return { ...campaign, status: 'cancelled' } as Campaign;
}

/**
 * Deletes a draft campaign and its related records.
 *
 * Only campaigns with status 'draft' can be deleted. Deletes related
 * recipients, logs, and attachments first, then the campaign itself.
 *
 * @param id - The campaign UUID to delete.
 * @throws NotFoundError when the campaign does not exist.
 * @throws BadRequestError when the campaign is not in draft status.
 */
export async function deleteCampaign(id: string): Promise<void> {
    const { data: campaign, error: fetchError } = await supabase
        .from('announcements')
        .select('status')
        .eq('id', id)
        .single();

    if (fetchError || !campaign) throw new NotFoundError('Campaign');
    if (campaign.status !== 'draft') {
        throw new BadRequestError('Only draft campaigns can be deleted');
    }

    // Delete related records first (foreign keys may not have ON DELETE CASCADE)
    await supabase.from('announcement_recipients').delete().eq('announcement_id', id);
    await supabase.from('announcement_logs').delete().eq('announcement_id', id);
    await supabase.from('announcement_attachments').delete().eq('announcement_id', id);

    const { error: deleteError } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

    if (deleteError) throw new Error(`Failed to delete campaign: ${deleteError.message}`);
}

/**
 * Partially updates a campaign's mutable fields.
 *
 * Only campaigns in 'draft' or 'scheduled' status can be updated.
 * Inserts an audit log entry with action 'edited'.
 *
 * @param id - The campaign UUID to update.
 * @param updates - Partial fields to apply.
 * @returns The updated campaign.
 * @throws NotFoundError when the campaign does not exist.
 * @throws BadRequestError when the campaign status is not editable.
 */
export async function updateCampaign(
    id: string,
    updates: UpdateCampaignRequest,
): Promise<Campaign> {
    const { data: campaign, error: fetchError } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !campaign) throw new NotFoundError('Campaign');
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        throw new BadRequestError('Only draft or scheduled campaigns can be edited');
    }

    const { error: updateError } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id);
    if (updateError) throw new Error(`Failed to update campaign: ${updateError.message}`);

    if (campaign.status === 'scheduled') {
        const log: Database['public']['Tables']['announcement_logs']['Insert'] = {
            announcement_id: id,
            action: 'edited',
            user_id: campaign.created_by,
        };
        const { error: logError } = await supabase.from('announcement_logs').insert(log);
        if (logError) throw new Error(`Failed to write audit log: ${logError.message}`);
    }

    return { ...campaign, ...updates } as Campaign;
}

type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];

/**
 * Common dispatch function used by both immediate approval and BullMQ worker.
 *
 * Resolves targets, creates recipient rows, sends notifications per channel,
 * updates recipient statuses, and transitions campaign to 'sent'.
 *
 * **Idempotency guarantees:**
 * - If the campaign is already `sent`, returns immediately (safe to call twice).
 * - Before inserting recipient rows, checks which users already have a row for
 *   this campaign and only inserts the missing ones — prevents duplicate rows on
 *   retry or BullMQ re-delivery.
 * - FCM is only sent to recipients still in `pending` status (step 3 filters on
 *   `delivery_status = 'pending'`), so already-sent or already-failed recipients
 *   are never re-notified.
 *
 * Caller owns the campaign fetch — this function only handles the write side.
 *
 * @param campaign - The raw campaign row from Supabase.
 * @param userIds - Pre-resolved user IDs (skips an RPC call when provided).
 * @throws Error on FCM total batch failure or DB errors (caller should mark campaign failed)
 */
export async function dispatchCampaign(
    campaign: AnnouncementRow,
    userIds?: string[],
): Promise<void> {
    if (campaign.status === 'sent') return;

    const targeting = campaign.targeting as TargetingExpression;
    const channels = campaign.channels;
    const resolvedUserIds = userIds ?? (await resolveAudience(targeting));

    if (resolvedUserIds.length === 0) {
        throw new Error('No recipients matched the targeting expression');
    }

    // 1. Create recipient rows (skip users that already have a row)
    const { data: existing } = await supabase
        .from('announcement_recipients')
        .select('user_id')
        .eq('announcement_id', campaign.id);
    const existingIds = new Set(existing?.map((r) => r.user_id) ?? []);
    const newUserIds = resolvedUserIds.filter((id) => !existingIds.has(id));

    if (newUserIds.length > 0) {
        const recipients = newUserIds.map((userId) => ({
            announcement_id: campaign.id,
            user_id: userId,
            delivery_status: 'pending' as const,
        }));
        const { error: insertError } = await supabase
            .from('announcement_recipients')
            .insert(recipients);
        if (insertError) {
            throw new Error(`Failed to create recipient rows: ${insertError.message}`);
        }
    }

    // 2. Dispatch per channel
    const failedUserIds = new Set<string>();

    if (channels.includes('mobile_push') && campaign.notification_text) {
        const pushResult = await pushToUsers(
            resolvedUserIds,
            campaign.title,
            campaign.notification_text,
            { campaign_id: campaign.id },
        );
        for (const id of pushResult.failedUserIds) failedUserIds.add(id);
    }

    // TODO: MS Graph Email via Outlook (VOIS-46)

    if (channels.includes('teams')) {

        if (!campaign.teams_message) {
            throw new Error(
                'Teams is selected but the campaign has no Teams message',
            );
        }


        /*
         * Convert the AI-generated business targets
         * into Microsoft Teams destinations.
         *
         * Example:
         *
         * HR
         *   ↓
         * HR Team / Announcments
         *
         * Full Stack Guild
         *   ↓
         * FULL STACK Team / Announcments
         */

        const destinations =
            await resolveTeamsDestinations(
                targeting,
            );


        if (destinations.length === 0) {
            throw new Error(
                'Teams is selected but no Teams destination is configured for the campaign targets',
            );
        }
        const teamsImportance =
            campaign.priority === 'critical'
                ? 'urgent'
                : campaign.priority === 'important'
                    ? 'high'
                    : 'normal';
        /*
         * A campaign may target more than one
         * business group, so send to every
         * resolved Teams destination.
         */

        for (const destination of destinations) {

            await sendTeamsChannelMessage(
                campaign.id,
                destination.teamId,
                destination.channelId,
                campaign.teams_message,
                teamsImportance,
            );
        }
    }

    // 3. Update recipient statuses
    const failedArray = [...failedUserIds];
    if (failedArray.length > 0) {
        const { error: failError } = await supabase
            .from('announcement_recipients')
            .update({ delivery_status: 'failed' })
            .eq('announcement_id', campaign.id)
            .in('user_id', failedArray);
        if (failError) {
            throw new Error(
                `Failed to update failed recipient statuses: ${failError.message}`,
            );
        }
    }
    const { error: sentError } = await supabase
        .from('announcement_recipients')
        .update({ delivery_status: 'sent', delivered_at: new Date().toISOString() })
        .eq('announcement_id', campaign.id)
        .eq('delivery_status', 'pending');
    if (sentError) {
        throw new Error(`Failed to update sent recipient statuses: ${sentError.message}`);
    }

    // 4. Transition campaign status
    const { error: statusError } = await supabase
        .from('announcements')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', campaign.id);
    if (statusError) {
        throw new Error(`Failed to transition campaign to sent: ${statusError.message}`);
    }

    // 5. Audit log
    const log: Database['public']['Tables']['announcement_logs']['Insert'] = {
        announcement_id: campaign.id,
        action: 'sent',
        user_id: campaign.created_by,
    };
    const { error: logError } = await supabase.from('announcement_logs').insert(log);
    if (logError) {
        throw new Error(`Failed to write dispatch audit log: ${logError.message}`);
    }
}

/**
 * Approves a draft campaign: validates targeting, then transitions to
 * scheduled or dispatches immediately.
 *
 * Flow:
 * 1. Fetch campaign, assert status === 'draft'
 * 2. Resolve targets via resolveAudience() — validation gate
 *    - If zero users match -> throw BadRequestError (campaign stays draft)
 * 3. Log action: 'approved'
 * 4. If scheduled_at is future -> status 'scheduled', log 'scheduled'
 *    // BullMQ: queue delayed job
 * 5. If immediate -> dispatchCampaign(campaign)
 *    - On total FCM failure -> throws, error handler returns 500, campaign stays draft
 *
 * @throws NotFoundError when the campaign does not exist.
 * @throws BadRequestError when campaign is not draft or targeting matches no one.
 */
export async function approveCampaign(id: string, userId: string): Promise<Campaign> {
    const { data: campaign, error: fetchError } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !campaign) throw new NotFoundError('Campaign');
    if (campaign.status !== 'draft') {
        throw new BadRequestError('Only draft campaigns can be approved');
    }

    // Validate targeting resolves to at least one user
    const targeting = campaign.targeting as TargetingExpression;
    const userIds = await resolveAudience(targeting);
    if (userIds.length === 0) {
        throw new BadRequestError('No recipients match the selected targeting');
    }

    // Log approval
    const approvedLog: Database['public']['Tables']['announcement_logs']['Insert'] = {
        announcement_id: id,
        action: 'approved',
        user_id: userId,
    };
    const { error: logError } = await supabase
        .from('announcement_logs')
        .insert(approvedLog);
    if (logError) {
        throw new Error(`Failed to write approval audit log: ${logError.message}`);
    }

    const isScheduled =
        campaign.scheduled_at && new Date(campaign.scheduled_at) > new Date();

    if (isScheduled) {
        const { error: updateError } = await supabase
            .from('announcements')
            .update({ status: 'scheduled' })
            .eq('id', id);
        if (updateError) {
            throw new Error(`Failed to schedule campaign: ${updateError.message}`);
        }

        const scheduledLog: Database['public']['Tables']['announcement_logs']['Insert'] =
        {
            announcement_id: id,
            action: 'scheduled',
            user_id: userId,
        };
        const { error: schedLogError } = await supabase
            .from('announcement_logs')
            .insert(scheduledLog);
        if (schedLogError) {
            throw new Error(
                `Failed to write scheduled audit log: ${schedLogError.message}`,
            );
        }

        // TODO: BullMQ delayed job when Redis is available (VOIS-78)
        return { ...campaign, status: 'scheduled' } as Campaign;
    } else {
        await dispatchCampaign(campaign, userIds);
        return { ...campaign, status: 'sent' } as Campaign;
    }
}
