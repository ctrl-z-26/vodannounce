import { type Database } from '@shared/supabase/database.types.js';

export type DevicePlatform = Database['public']['Enums']['device_platform'];
export type InsertDeviceTokenDto =
    Database['public']['Tables']['device_tokens']['Insert'];

/**
 * Outcome of a push fan-out send.
 *
 * @remarks
 * A user is reported as failed only when none of their device tokens accepted
 * the message (a multi-token user counts as sent if any token succeeds). Users
 * without any stored token are simply absent from the list — the caller cannot
 * distinguish "no device registered" from "accepted". Total batch failure still
 * throws instead of returning — see `pushToUsers`.
 *
 * @remarks
 * Used by the campaigns orchestrator to record per-user `delivery_status` in
 * `announcement_recipients`.
 */
export interface PushResult {
    failedUserIds: string[];
}

// 2. Define frontend incoming request payloads (DTOs) unique to this module's endpoints
export interface RegisterDeviceRequest {
    fcmToken: string;
    devicePlatform: DevicePlatform;
}
