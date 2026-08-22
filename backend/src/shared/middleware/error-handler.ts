import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { z } from 'zod';
import { HttpError } from '../error/http-error.js';

/**
 * Centralized Express error-handler middleware.
 *
 * Registered **last** in the middleware stack so every thrown or forwarded error
 * reaches this handler. The response body follows a consistent shape:
 *
 * - **HttpError** (operational): `{ error, code }` with the class's status.
 * - **ZodError** (operational):  `{ error, code, details }` with 400.
 * - **Unknown** (programming):  `{ error, code }` with 500 and a console log.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (res.headersSent) return;

    if (err instanceof HttpError) {
        res.status(err.statusCode).json({
            error: err.message,
            code: err.code,
        });
        return;
    }

    if (err instanceof ZodError) {
        res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: z.treeifyError(err),
        });
        return;
    }

    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
    });
};
