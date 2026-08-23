import { HttpError } from './http-error.js';

/**
 * Thrown when the caller is not authenticated (HTTP 401).
 *
 * @example
 * throw new UnauthorizedError('Invalid or expired access token');
 */
export class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized') {
        super(401, message, 'UNAUTHORIZED');
    }
}
