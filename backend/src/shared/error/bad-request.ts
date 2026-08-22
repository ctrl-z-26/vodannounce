import { HttpError } from './http-error.js';

/**
 * Thrown when the request is malformed or fails validation (HTTP 400).
 *
 * @example
 * throw new BadRequestError('scheduledAt must be a future date');
 */
export class BadRequestError extends HttpError {
    constructor(message: string) {
        super(400, message, 'BAD_REQUEST');
    }
}
