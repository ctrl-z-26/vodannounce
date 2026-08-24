import { describe, it, expect } from 'vitest';
import { envSchema } from './env.js';

describe('Environment Variables Schema Validation', () => {
    it('should successfully pass with valid parameters and convert PORT to a number', () => {
        const validEnv = {
            PORT: '4000',
            GEMINI_API_KEY: 'test-key',
            SUPABASE_URL: 'https://supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'secret-key',
            FCM_SERVICE_ACCOUNT_JSON: JSON.stringify({
                project_id: 'my-project',
                private_key: 'key',
            }),
        };

        const result = envSchema.safeParse(validEnv);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.PORT).toBe(4000);
            expect(result.data.GEMINI_MODEL).toBe('gemini-2.5-flash'); // default value
            expect(typeof result.data.FCM_SERVICE_ACCOUNT_JSON).toBe('object');
        }
    });

    it('should allow overriding GEMINI_MODEL', () => {
        const envWithModel = {
            PORT: '3000',
            GEMINI_API_KEY: 'test-key',
            GEMINI_MODEL: 'gemini-3.5-flash-lite',
            SUPABASE_URL: 'https://supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'secret-key',
            FCM_SERVICE_ACCOUNT_JSON: '{}',
        };

        const result = envSchema.safeParse(envWithModel);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.GEMINI_MODEL).toBe('gemini-3.5-flash-lite');
        }
    });

    it('should fail validation if a required key like SUPABASE_URL is missing', () => {
        const invalidEnv = {
            PORT: '3000',
            SUPABASE_SERVICE_ROLE_KEY: 'secret-key',
            FCM_SERVICE_ACCOUNT_JSON: '{}',
        };

        const result = envSchema.safeParse(invalidEnv);
        expect(result.success).toBe(false);
    });

    it('should reject a malformed or non-HTTP Supabase URL string', () => {
        const brokenUrlEnv = {
            PORT: '3000',
            SUPABASE_URL: 'not-a-valid-url-string',
            SUPABASE_SERVICE_ROLE_KEY: 'valid-secret-key',
            FCM_SERVICE_ACCOUNT_JSON: JSON.stringify({
                project_id: 'test',
                private_key: 'key',
            }),
        };

        const result = envSchema.safeParse(brokenUrlEnv);

        expect(result.success).toBe(false);
        if (!result.success) {
            const issue = result.error.issues.find((i) =>
                i.path.includes('SUPABASE_URL'),
            );
            expect(issue).toBeDefined();
        }
    });

    it('should reject an FCM string that is invalid JSON syntax', () => {
        const malformedJsonEnv = {
            PORT: '3000',
            SUPABASE_URL: 'https://supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'valid-secret-key',
            FCM_SERVICE_ACCOUNT_JSON: '{ hello: world, "arbitrary_key": 123 ',
        };

        const result = envSchema.safeParse(malformedJsonEnv);

        expect(result.success).toBe(false);
        if (!result.success) {
            const issue = result.error.issues.find((i) =>
                i.path.includes('FCM_SERVICE_ACCOUNT_JSON'),
            );
            expect(issue?.message).toContain(
                'FCM_SERVICE_ACCOUNT_JSON is not a valid minified JSON string',
            );
        }
    });
});
