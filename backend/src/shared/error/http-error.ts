/**
 * Base class for all HTTP errors thrown by backend services and controllers.
 *
 * Carries a numeric `statusCode` and a machine-readable `code` string so the
 * centralized error-handler middleware can format a consistent JSON response
 * without guessing from the message text.
 *
 * @example
 * throw new HttpError(418, "I'm a teapot", 'TEAPOT');
 */
export class HttpError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly code: string = 'ERROR',
    ) {
        super(message);
        this.name = 'HttpError';
    }
}
