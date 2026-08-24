import type { ServiceAccount } from 'firebase-admin';
import { z } from 'zod';

export const envSchema = z.object({
    PORT: z
        .string()
        .default('3000')
        .transform((val) => parseInt(val, 10)),

    GEMINI_API_KEY: z.string().min(1, 'Google AI Studio API key is required'),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

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

    AZURE_TENANT_ID: z
        .string()
        .min(1, 'Azure Tenant ID is required'),

    AZURE_CLIENT_ID: z
        .string()
        .min(1, 'Azure Client ID is required'),

    AZURE_CLIENT_SECRET: z
        .string()
        .min(1, 'Azure Client Secret is required'),

    TEAMS_TEST_TEAM_ID: z
        .string()
        .min(1, 'Teams test Team ID is required'),

    TEAMS_TEST_CHANNEL_ID: z
        .string()
        .min(1, 'Teams test Channel ID is required'),
    TEAMS_SENDER_EMAIL: z
        .string()
        .email('Teams sender email must be valid'),

    TEAMS_OAUTH_REDIRECT_URI: z
        .string()
        .url('Teams OAuth redirect URI must be valid'),

    WEB_APP_URL: z
        .string()
        .url('Web app URL must be valid'),

});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
    console.error('Invalid environment variables:');
    console.error(JSON.stringify(z.treeifyError(envParse.error), null, 2));
    process.exit(1);
}

export const env = envParse.data;
