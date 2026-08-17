import type {
    Request,
    Response,
    NextFunction,
} from 'express';

import { supabase } from '@shared/supabase/supabase.js';

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Authorization token missing',
        });
        return;
    }

    const accessToken = authHeader.substring(7);

    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(accessToken);

        if (error || !user) {
            res.status(401).json({
                error: 'Invalid or expired access token',
            });
            return;
        }

        res.locals.userId = user.id;

        next();
    } catch {
        res.status(401).json({
            error: 'Authentication failed',
        });
    }
}