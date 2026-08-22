import { type Request, type Response } from 'express';
import * as fcmService from './fcm.service.js';
import type { RegisterDeviceRequest } from './fcm.types.js';
import { BadRequestError } from '@shared/error/index.js';

export async function handleDeviceRegistration(
    req: Request<{}, {}, RegisterDeviceRequest>,
    res: Response,
): Promise<void> {
    const { fcmToken, devicePlatform } = req.body;
    const userId = res.locals.userId as string;

    if (!fcmToken) throw new BadRequestError('FCM Token missing');
    if (!devicePlatform) throw new BadRequestError('Device platform missing');

    await fcmService.saveDeviceToken(userId, fcmToken, devicePlatform);
    res.status(200).json({ success: true, message: 'Device mapped.' });
}

export async function handleTestNotification(req: Request, res: Response): Promise<void> {
    const userId = res.locals.userId as string;

    await fcmService.pushToUser(
        userId,
        'VOIS Pulse',
        'Your push notifications are working!',
        { type: 'test' },
    );

    res.status(200).json({ success: true, message: 'Test notification sent.' });
}
