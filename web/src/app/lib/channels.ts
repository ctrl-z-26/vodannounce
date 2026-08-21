import { Mail, MessageSquare, Smartphone, type LucideIcon } from 'lucide-react';
import type { AnnouncementChannel } from '@shared/types/campaign';

/** Static presentation metadata for each delivery channel. */
export const CHANNEL_META: Record<
    AnnouncementChannel,
    { name: string; short: string; icon: LucideIcon }
> = {
    teams: { name: 'Microsoft Teams', short: 'Teams', icon: MessageSquare },
    email: { name: 'Microsoft Outlook', short: 'Outlook', icon: Mail },
    mobile_push: { name: 'Mobile Push', short: 'Mobile Push', icon: Smartphone },
};

/** Human label for a priority value, e.g. `critical` -> `Critical`. */
export function priorityLabel(p: string): string {
    return p.charAt(0).toUpperCase() + p.slice(1);
}
