import { Router } from 'express';

import { handleDeviceRegistration, handleTestNotification, } from './fcm.controller.js';
import { requireAuth } from '@shared/middleware/auth.middleware.js';

const router = Router();

router.post(
    '/register',
    requireAuth,
    handleDeviceRegistration,
);

router.post(
    '/test',
    requireAuth,
    handleTestNotification,
);

export const fcmRoutes = router;