import { fcm } from './fcm.config.js';
import { supabase } from '@shared/supabase/supabase.js';
import {
    chunkTokens,
    collectPrunableTokens,
    collectSucceededUserIds,
} from './fcm.utils.js';
import type { DevicePlatform, PushResult } from './fcm.types.js';
import type { Message } from 'firebase-admin/messaging';

export async function saveDeviceToken(
    userId: string,
    token: string,
    platform: DevicePlatform,
): Promise<void> {
    const { error } = await supabase
        .from('device_tokens')
        .upsert(
            { user_id: userId, token: token, platform: platform },
            { onConflict: 'token' },
        );

    if (error) throw new Error(`Database save failed: ${error.message}`);
}

/**
 * Sends a push notification to every device belonging to the given users.
 *
 * @remarks
 * Fetches all device tokens across the target users in a single query, then
 * fans the message out to all of them in one `sendEach` invocation per 500-token
 * chunk (the SDK hard-throws above that cap). The `apns` sound block is attached
 * only to tokens registered as `ios` — it is meaningless to Android/web pushes.
 * Tokens FCM reports as permanently invalid (`registration-token-not-registered`
 * / `invalid-registration-token`) are pruned from `device_tokens` to keep the
 * table clean.
 *
 * @param userIds - The recipients whose device tokens should receive the message.
 * @param title - The notification title.
 * @param body - The notification body.
 * @param data - Optional key/value payload (e.g. `campaign_id`) for tap handling.
 * @returns `{ failedUserIds }` — the users whose tokens all failed to send (see
 * {@link PushResult}). Users with no stored tokens are absent.
 * @throws If the device-token query fails or every message in the batch failed
 * to send (e.g. all tokens dead or a systemic FCM error), letting the caller
 * log the campaign as `FAILED`.
 */
export async function pushToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
): Promise<PushResult> {
    const { data: rows, error } = await supabase
        .from('device_tokens')
        .select('token, platform, user_id')
        .in('user_id', userIds);
    if (error) throw new Error(`Failed to fetch device tokens: ${error.message}`);
    if (!rows || rows.length === 0) return { failedUserIds: [] };

    const tokens = rows.map((row) => row.token);
    const userIdByToken = new Map(rows.map((row) => [row.token, row.user_id]));
    const platformByToken = new Map(rows.map((row) => [row.token, row.platform]));
    const attemptedUserIds = new Set(rows.map((row) => row.user_id));
    const succeededUserIds = new Set<string>();
    let prunable: string[] = [];
    let totalFailures = 0;

    for (const chunk of chunkTokens(tokens)) {
        const messages: Message[] = chunk.map((token) => ({
            token,
            notification: { title, body },
            ...(platformByToken.get(token) === 'ios'
                ? { apns: { payload: { aps: { sound: 'default' } } } }
                : {}),
            ...(data ? { data } : {}),
        }));

        const batch = await fcm.sendEach(messages);
        totalFailures += batch.failureCount;
        prunable = prunable.concat(collectPrunableTokens(batch.responses, chunk));
        for (const userId of collectSucceededUserIds(
            batch.responses,
            chunk,
            userIdByToken,
        )) {
            succeededUserIds.add(userId);
        }
    }

    if (totalFailures === tokens.length) {
        throw new Error('FCM send failed: every message in the batch failed');
    }

    if (prunable.length > 0) {
        await supabase.from('device_tokens').delete().in('token', prunable);
    }

    const failedUserIds = [...attemptedUserIds].filter(
        (userId) => !succeededUserIds.has(userId),
    );
    return { failedUserIds };
}

/**
 * Sends a push notification to every device belonging to a single user.
 *
 * @param userId - The recipient whose device tokens should receive the message.
 * @param title - The notification title.
 * @param body - The notification body.
 * @param data - Optional key/value payload (e.g. `campaign_id`) for tap handling.
 * @returns `{ failedUserIds }` — `[userId]` when none of the user's tokens
 * were accepted, `[]` otherwise.
 */
export async function pushToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
): Promise<PushResult> {
    return pushToUsers([userId], title, body, data);
}
