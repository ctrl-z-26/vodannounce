import { createClient } from '@supabase/supabase-js';
import { type Database } from './database.types.js';
import { env } from '@shared/config/env.js';

/**
 * Global administrative Supabase client instance.
 *
 * @warning This client uses the `SERVICE_ROLE` secret key. It completely
 * bypasses Row Level Security (RLS) policies. Use with extreme caution.
 */
export const supabase = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
);
