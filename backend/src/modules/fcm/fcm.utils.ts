import type { SendResponse } from 'firebase-admin/messaging';

/**
 * Splits a token list into ordered chunks of at most `size` items.
 *
 * @remarks
 * Required because the FCM `sendEach` API hard-throws when handed more than
 * 500 messages in a single invocation.
 *
 * @param tokens - The full list of device tokens to split.
 * @param size - Maximum chunk length (defaults to the FCM batch cap of 500).
 * @returns An array of token chunks preserving the original ordering.
 */
export function chunkTokens(tokens: string[], size = 500): string[][] {
    const chunks: string[][] = [];
    for (let i = 0; i < tokens.length; i += size) {
        chunks.push(tokens.slice(i, i + size));
    }
    return chunks;
}

/**
 * Error code returned by FCM when a registration token is permanently invalid.
 */
const UNREGISTERED_CODES = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
]);

/**
 * Returns the tokens whose corresponding send response reported a permanent
 * registration failure, so callers can prune them from the database.
 *
 * @remarks
 * Responses are zipped with tokens by index (FCM returns responses in the
 * order the messages were sent). Transient failures (e.g. rate limits) are
 * deliberately excluded — those tokens are still valid and should be retried,
 * not deleted.
 *
 * @param responses - The `BatchResponse.responses` list from `sendEach`.
 * @param tokens - The token list sent to `sendEach`, same order as `responses`.
 * @returns The tokens that should be deleted from the `device_tokens` table.
 */
export function collectPrunableTokens(
    responses: readonly SendResponse[],
    tokens: readonly string[],
): string[] {
    return tokens.filter((_, index) => {
        const response = responses[index];
        return (
            response !== undefined &&
            !response.success &&
            response.error !== undefined &&
            UNREGISTERED_CODES.has(response.error.code)
        );
    });
}
