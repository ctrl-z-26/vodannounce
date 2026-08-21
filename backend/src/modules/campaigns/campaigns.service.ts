import { supabase } from '@shared/supabase/supabase.js';
import type { Database } from '@shared/supabase/database.types.js';
import type {
    AnalyzeAnnouncementRequest,
    Campaign,
    TargetContext,
} from '@root-shared/types/campaign.js';
import { analyzeAnnouncement, repairTargets } from '../llm/index.js';
import type { CampaignAnalysis } from '../llm/index.js';
import { findUnknownTargets } from './campaigns.utils.js';

/** Number of AI target-repair attempts allowed after the initial analysis. */
const MAX_REPAIRS = 2;

/**
 * Fetches the exact group/location names Gemini may reference as targets.
 */
async function fetchTargetContext(): Promise<TargetContext> {
    const [groupsResult, locationsResult] = await Promise.all([
        supabase.from('groups').select('name'),
        supabase.from('locations').select('name'),
    ]);
    if (groupsResult.error) throw new Error(`Failed to fetch groups: ${groupsResult.error.message}`);
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
    const targetContext = await fetchTargetContext();
    let analysis: CampaignAnalysis = await analyzeAnnouncement(request.prompt, targetContext);

    for (let attempt = 0; attempt < MAX_REPAIRS; attempt += 1) {
        const unknown = findUnknownTargets(
            analysis.targets,
            targetContext.groups,
            targetContext.locations,
        );
        if (unknown.length === 0) break;
        const targets = await repairTargets(request.prompt, analysis, unknown, targetContext);
        analysis = { ...analysis, targets };
    }

    const remaining = findUnknownTargets(
        analysis.targets,
        targetContext.groups,
        targetContext.locations,
    );
    if (remaining.length > 0) {
        throw new Error(
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
    const { data, error } = await supabase.from('announcements').insert(draft).select().single();
    if (error || !data) throw new Error(`Failed to create draft announcement: ${error?.message}`);

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
