import type { Request, Response, NextFunction } from 'express';

import { supabase } from '@shared/supabase/supabase.js';
import type { ProfileRole } from '@root-shared/types/campaign.js';
import { UnauthorizedError, ForbiddenError } from '@shared/error/index.js';

export async function requireAuth(
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Authorization token missing');
    }

    const accessToken = authHeader.substring(7);

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
        throw new UnauthorizedError('Invalid or expired access token');
    }

    _res.locals.userId = user.id;

    next();
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
            throw new UnauthorizedError('Authentication required');
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !data) {
            throw new ForbiddenError('Forbidden: profile not found');
        }

        if (!allowedRoles.includes(data.role)) {
            throw new ForbiddenError('Forbidden: insufficient role');
        }

        res.locals.userRole = data.role;
        next();
    };
}
