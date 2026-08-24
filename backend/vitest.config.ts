import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.test.ts'],
        env: {
            PORT: '3000',
            GEMINI_API_KEY: 'test-key',
            SUPABASE_URL: 'https://supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
            FCM_SERVICE_ACCOUNT_JSON: JSON.stringify({
                type: 'service_account',
                project_id: 'mock-firebase-id',
                private_key:
                    '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----',
                client_email: 'mock@://gserviceaccount.com',
            }),
        },
    },
});
