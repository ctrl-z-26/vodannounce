import { HttpError } from './http-error.js';

/**
 * Thrown when the caller is authenticated but lacks the required role (HTTP 403).
 *
 * @example
 * throw new ForbiddenError('Insufficient role');
 */
export class ForbiddenError extends HttpError {
    constructor(message = 'Forbidden') {
        super(403, message, 'FORBIDDEN');
    }
}
