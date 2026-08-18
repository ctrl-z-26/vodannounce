import type { ServiceAccount } from 'firebase-admin';
import { z } from 'zod';

export const envSchema = z.object({
    PORT: z
        .string()
        .default('3000')
        .transform((val) => parseInt(val, 10)),

    GOOGLE_AI_API_KEY: z
    .string()
    .min(1, 'Google AI Studio API key is required'),
    
    SUPABASE_URL: z.url('Invalid Supabase URL format'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
    FCM_SERVICE_ACCOUNT_JSON: z
        .string()
        .min(1, 'FCM Service Account JSON string is required')
        .transform((str, ctx) => {
            try {
                return JSON.parse(str) as ServiceAccount & Record<string, unknown>;
            } catch (e) {
                ctx.addIssue({
                    code: 'custom',
                    message:
                        'FCM_SERVICE_ACCOUNT_JSON is not a valid minified JSON string',
                });
                return z.NEVER;
            }
        }),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
    console.error('Invalid environment variables:');
    console.error(JSON.stringify(z.treeifyError(envParse.error), null, 2));
    process.exit(1);
}

export const env = envParse.data;
