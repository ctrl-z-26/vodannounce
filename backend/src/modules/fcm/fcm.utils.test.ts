import { describe, it, expect } from 'vitest';
import { chunkTokens, collectPrunableTokens } from './fcm.utils.js';
import type { FirebaseError } from 'firebase-admin/app';
import type { SendResponse } from 'firebase-admin/messaging';

function ok(messageId = 'msg'): SendResponse {
    return { success: true, messageId };
}

function fail(code: string): SendResponse {
    return { success: false, error: { code, message: code } as FirebaseError };
}

describe('chunkTokens', () => {
    it('returns an empty array for no tokens', () => {
        expect(chunkTokens([])).toEqual([]);
    });

    it('keeps a single chunk when under the cap', () => {
        const tokens = Array.from({ length: 10 }, (_, i) => `t${i}`);
        expect(chunkTokens(tokens)).toEqual([tokens]);
    });

    it('keeps exactly one chunk at the cap boundary', () => {
        const tokens = Array.from({ length: 500 }, (_, i) => `t${i}`);
        expect(chunkTokens(tokens).length).toBe(1);
    });

    it('splits into [500, 1] for 501 tokens', () => {
        const tokens = Array.from({ length: 501 }, (_, i) => `t${i}`);
        const chunks = chunkTokens(tokens);
        expect(chunks).toHaveLength(2);
        expect(chunks[0]).toHaveLength(500);
        expect(chunks[1]).toEqual(['t500']);
    });

    it('preserves token order across chunks', () => {
        const tokens = Array.from({ length: 1003 }, (_, i) => `t${i}`);
        expect(chunkTokens(tokens).flat()).toEqual(tokens);
    });

    it('respects a custom chunk size', () => {
        const tokens = Array.from({ length: 7 }, (_, i) => `t${i}`);
        const chunks = chunkTokens(tokens, 3);
        expect(chunks.map((c) => c.length)).toEqual([3, 3, 1]);
    });
});

describe('collectPrunableTokens', () => {
    it('returns no tokens when all sends succeeded', () => {
        const tokens = ['a', 'b'];
        const responses = [ok(), ok()];
        expect(collectPrunableTokens(responses, tokens)).toEqual([]);
    });

    it('returns only the tokens whose send permanently failed', () => {
        const tokens = ['a', 'b', 'c'];
        const responses = [
            ok(),
            fail('messaging/registration-token-not-registered'),
            ok(),
        ];
        expect(collectPrunableTokens(responses, tokens)).toEqual(['b']);
    });

    it('returns every token when all are unregistered', () => {
        const tokens = ['a', 'b'];
        const responses = [
            fail('messaging/registration-token-not-registered'),
            fail('messaging/invalid-registration-token'),
        ];
        expect(collectPrunableTokens(responses, tokens)).toEqual(['a', 'b']);
    });

    it('does not prune transient failures', () => {
        const tokens = ['a', 'b'];
        const responses = [fail('messaging/unavailable'), fail('messaging/internal')];
        expect(collectPrunableTokens(responses, tokens)).toEqual([]);
    });

    it('keeps response-to-token alignment by index', () => {
        const tokens = ['a', 'b', 'c'];
        const responses = [
            fail('messaging/registration-token-not-registered'),
            ok(),
            fail('messaging/registration-token-not-registered'),
        ];
        expect(collectPrunableTokens(responses, tokens)).toEqual(['a', 'c']);
    });
});
