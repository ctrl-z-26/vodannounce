import type { Database } from '@shared/supabase/database.types.js';
import type {
    Campaign,
    CampaignRecipient,
    TargetingExpression,
} from '@root-shared/types/campaign.js';

/**
 * Resolves to true only when A and B are identical (mutually assignable).
 */
type AssertEqual<A, B> =
    (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

type Expect<T extends true> = T;

type AnnouncementsRow = Database['public']['Tables']['announcements']['Row'];
type RecipientsRow = Database['public']['Tables']['announcement_recipients']['Row'];

// The generated Row stores `targeting` as the raw jsonb `Json` union while the
// shared DTO narrows it to the DNF expression, so that one field is locked
// separately. Do not merge these into one Omit-&-intersection assertion: an
// intersection never compares identical under AssertEqual, even when the
// shapes match.
type _campaignFieldsLock = Expect<
    AssertEqual<Omit<Campaign, 'targeting'>, Omit<AnnouncementsRow, 'targeting'>>
>;
type _campaignTargetingLock = Expect<AssertEqual<Campaign['targeting'], TargetingExpression>>;
type _recipientLocks = Expect<
    AssertEqual<Omit<CampaignRecipient, 'full_name' | 'departments'>, RecipientsRow>
>;
