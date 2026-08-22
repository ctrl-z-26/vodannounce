import { HttpError } from './http-error.js';

/**
 * Thrown when a requested resource does not exist (HTTP 404).
 *
 * @example
 * throw new NotFoundError('Campaign');
 */
export class NotFoundError extends HttpError {
    constructor(resource = 'Resource') {
        super(404, `${resource} not found`, 'NOT_FOUND');
    }
}
