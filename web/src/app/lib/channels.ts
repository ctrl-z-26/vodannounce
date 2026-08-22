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

/** Consistent display order for all channel lists. */
export const CHANNEL_ORDER: AnnouncementChannel[] = ['email', 'teams', 'mobile_push'];

const CHANNEL_STYLES = [
    { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { bg: 'bg-blue-50', text: 'text-blue-600' },
    { bg: 'bg-green-50', text: 'text-green-600' },
] as const;

/** Returns Tailwind classes for the channel icon background and text color at a given index. */
export function channelIconStyle(i: number): { bg: string; text: string } {
    return CHANNEL_STYLES[i % CHANNEL_STYLES.length];
}

/** Human label for a priority value, e.g. `critical` -> `Critical`. */
export function priorityLabel(p: string): string {
    return p.charAt(0).toUpperCase() + p.slice(1);
}
