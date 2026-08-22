import { supabase } from '@shared/supabase/supabase.js';
import type { Database } from '@shared/supabase/database.types.js';
import type {
    AnalyzeAnnouncementRequest,
    Campaign,
    TargetContext,
    UpdateCampaignRequest,
} from '@root-shared/types/campaign.js';
import { analyzeAnnouncement, repairTargets } from '../llm/index.js';
import type { CampaignAnalysis } from '../llm/index.js';
import { findUnknownTargets } from './campaigns.utils.js';
import { BadRequestError, NotFoundError } from '@shared/error/index.js';

/** Number of AI target-repair attempts allowed after the initial analysis. */
const MAX_REPAIRS = 2;

/**
 * Fetches the exact group/location names Gemini may reference as targets.
 */
export async function getTargetContext(): Promise<TargetContext> {
    const [groupsResult, locationsResult] = await Promise.all([
        supabase.from('groups').select('name'),
        supabase.from('locations').select('name'),
    ]);
    if (groupsResult.error)
        throw new Error(`Failed to fetch groups: ${groupsResult.error.message}`);
    if (locationsResult.error) {
        throw new Error(`Failed to fetch locations: ${locationsResult.error.message}`);
    }
    return {
        groups: groupsResult.data.map((row) => row.name),
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
        const unknown = findUnknownTargets(
            analysis.targets,
            targetContext.groups,
            targetContext.locations,
        );
        if (unknown.length === 0) break;
        const targets = await repairTargets(
            request.prompt,
            analysis,
            unknown,
            targetContext,
        );
        analysis = { ...analysis, targets };
    }

    const remaining = findUnknownTargets(
        analysis.targets,
        targetContext.groups,
        targetContext.locations,
    );
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
 * Returns all recipient records for a given announcement.
 */
export async function getCampaignRecipients(
    campaignId: string,
): Promise<Database['public']['Tables']['announcement_recipients']['Row'][]> {
    const { data, error } = await supabase
        .from('announcement_recipients')
        .select('*')
        .eq('announcement_id', campaignId);
    if (error) throw new Error(`Failed to fetch recipients: ${error.message}`);
    return data ?? [];
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
