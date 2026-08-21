import type {
    Request,
    Response,
    NextFunction,
} from 'express';

import { supabase } from '@shared/supabase/supabase.js';
import type { ProfileRole } from '@root-shared/types/campaign.js';

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

/**
 * Express middleware factory that restricts access to users whose profile role
 * is in the provided allow-list. Must be composed **after** {@link requireAuth}
 * so that `res.locals.userId` is already set.
 *
 * @param allowedRoles - One or more {@link ProfileRole} values that grant access.
 * @returns An Express middleware that queries the `profiles` table and returns
 *          403 when the role is not in the allow-list.
 */
export function requireRole(...allowedRoles: ProfileRole[]) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = res.locals.userId as string | undefined;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !data) {
            res.status(403).json({ error: 'Forbidden: profile not found' });
            return;
        }

        if (!allowedRoles.includes(data.role)) {
            res.status(403).json({ error: 'Forbidden: insufficient role' });
            return;
        }

        res.locals.userRole = data.role;
        next();
    };
}