// Announcement enums, mirror the values in
// Database["public"]["Enums"] (backend/src/shared/supabase/database.types.ts)

/** User role in the system, mirrors the `profile_role` DB enum. */
export type ProfileRole = 'admin' | 'sender' | 'employee';

/** Delivery channel for an announcement. */
export type AnnouncementChannel = 'email' | 'teams' | 'mobile_push';

/** Severity classification of an announcement. */
export type AnnouncementPriority = 'normal' | 'important' | 'critical';

/** Lifecycle state of an announcement. */
export type AnnouncementStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';

/** Per-recipient delivery progress. */
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed';

/** Kind of an auditable target: a named group or a physical location. */
export type TargetType = 'group' | 'location';

/** A single auditable target: a named group or a physical location. */
export type Target = {
    type: TargetType;
    name: string;
};

/**
 * One AND cell of a targeting expression: a set of targets that must all match.
 *
 * @see TargetingExpression
 */
export type TargetingCell = Target[];

/**
 * Full targeting expression in disjunctive normal form (DNF).
 *
 * A physical location target is expanded to its footprint groups at
 * resolution time, and the whole expression is stored as the
 * `announcements.targeting` jsonb column exactly as the AI outputs it, the
 * single target shape shared between backend and frontend.
 *
 * @remarks
 * The outer array is an OR (union) of cells; each inner array is an AND
 * (intersection) across its targets.
 *
 * @example
 * `[['Security'], ['B1']]` means "Security group OR everyone at location B1".
 */
export type TargetingExpression = TargetingCell[];

/** The exact group/location names an analyze call may reference. */
export type TargetContext = {
    groups: string[];
    locations: string[];
};

// POST /api/campaign/analyze

/**
 * Request body for AI campaign analysis (announcement prompt + schedule date).
 */
export interface AnalyzeAnnouncementRequest {
    /** The manager's natural-language announcement draft. */
    prompt: string;
    /** ISO-8601 date/time the announcement is scheduled for. */
    scheduledAt: string;
}

/**
 * An announcement campaign as served to web and mobile clients.
 *
 * Mirrors the `announcements` table Row; the AI analysis output is
 * backend-only and is converted into a draft announcement before it is ever
 * returned.
 */
export interface Campaign {
    id: string;
    title: string;
    original_text: string;
    priority: AnnouncementPriority;
    status: AnnouncementStatus;
    channels: AnnouncementChannel[];
    /** DNF targeting expression, stored as `targeting` jsonb. @see TargetingExpression */
    targeting: TargetingExpression;
    notification_text: string | null;
    email_subject: string | null;
    email_body: string | null;
    teams_message: string | null;
    teams_channel_ids: string[] | null;
    scheduled_at: string | null;
    sent_at: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

/** A per-user delivery/acknowledgement record within a campaign, mirroring the `announcement_recipients` table Row. */
export interface CampaignRecipient {
    id: string;
    announcement_id: string;
    user_id: string;
    delivery_status: DeliveryStatus;
    delivered_at: string | null;
    read_at: string | null;
    created_at: string;
}
