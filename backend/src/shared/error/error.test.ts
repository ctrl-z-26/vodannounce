import { describe, it, expect } from 'vitest';
import {
    HttpError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
} from './index.js';

describe('HttpError', () => {
    it('carries statusCode, message, and code', () => {
        const err = new HttpError(418, "I'm a teapot", 'TEAPOT');
        expect(err.statusCode).toBe(418);
        expect(err.message).toBe("I'm a teapot");
        expect(err.code).toBe('TEAPOT');
        expect(err.name).toBe('HttpError');
    });

    it('defaults code to ERROR', () => {
        const err = new HttpError(500, 'boom');
        expect(err.code).toBe('ERROR');
    });

    it('is an instance of Error', () => {
        expect(new HttpError(400, 'bad')).toBeInstanceOf(Error);
    });
});

describe('NotFoundError', () => {
    it('returns 404 with resource name in message', () => {
        const err = new NotFoundError('Campaign');
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Campaign not found');
        expect(err.code).toBe('NOT_FOUND');
    });

    it('defaults to "Resource not found"', () => {
        expect(new NotFoundError().message).toBe('Resource not found');
    });
});

describe('BadRequestError', () => {
    it('returns 400 with custom message', () => {
        const err = new BadRequestError('scheduledAt must be future');
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe('scheduledAt must be future');
        expect(err.code).toBe('BAD_REQUEST');
    });
});

describe('UnauthorizedError', () => {
    it('returns 401 with default message', () => {
        const err = new UnauthorizedError();
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Unauthorized');
        expect(err.code).toBe('UNAUTHORIZED');
    });

    it('accepts a custom message', () => {
        expect(new UnauthorizedError('Token expired').message).toBe('Token expired');
    });
});

describe('ForbiddenError', () => {
    it('returns 403 with default message', () => {
        const err = new ForbiddenError();
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe('Forbidden');
        expect(err.code).toBe('FORBIDDEN');
    });

    it('accepts a custom message', () => {
        expect(new ForbiddenError('Insufficient role').message).toBe('Insufficient role');
    });
});
