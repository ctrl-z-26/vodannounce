import { createClient } from '@supabase/supabase-js';
import { type Database } from './database.types.js';
import { env } from './config/env.js';

export const supabase = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
);
