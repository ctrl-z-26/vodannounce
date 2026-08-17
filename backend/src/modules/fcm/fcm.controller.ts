import { type Request, type Response } from 'express';
import * as fcmService from './fcm.service.js';
import type { RegisterDeviceRequest } from './fcm.types.js';

export async function handleDeviceRegistration(
    req: Request<{}, {}, RegisterDeviceRequest>,
    res: Response,
): Promise<void> {
    const { fcmToken, devicePlatform } = req.body;
    const userId = res.locals.userId as string;

    if (!fcmToken) {
        res.status(400).json({ error: 'FCM Token missing' });
        return;
    }

    if (!devicePlatform) {
        res.status(400).json({
            error: 'Device platform missing',
        });
        return;
    }



    try {
        await fcmService.saveDeviceToken(userId, fcmToken, devicePlatform);
        res.status(200).json({ success: true, message: 'Device mapped.' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }


}

export async function handleTestNotification(
    req: Request,
    res: Response,
): Promise<void> {

    const userId = res.locals.userId as string;

    try {

        await fcmService.pushToUser(
            userId,
            'VOIS Pulse',
            'Your push notifications are working!',
            {
                type: 'test',
            },
        );

        res.status(200).json({
            success: true,
            message: 'Test notification sent.',
        });

    } catch (error: any) {

        console.error(
            'Test notification failed:',
            error
        );

        res.status(500).json({
            error: error.message,
        });

    }
}