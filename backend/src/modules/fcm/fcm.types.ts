import { type Database } from '@shared/supabase/database.types.js';

export type DevicePlatform = Database['public']['Enums']['device_platform'];
export type InsertDeviceTokenDto =
    Database['public']['Tables']['device_tokens']['Insert'];

// 2. Define frontend incoming request payloads (DTOs) unique to this module's endpoints
export interface RegisterDeviceRequest {
    fcmToken: string;
    devicePlatform: DevicePlatform;
}
