import { type Request, type Response } from 'express';
// import * as fcmService from './fcm.service.js';

export async function handleDeviceRegistration(
    req: Request,
    res: Response,
): Promise<void> {
    const { fcmToken, deviceType } = req.body;
    // const userId = req.user?.id; // Supplied via auth middleware

    if (!fcmToken) {
        res.status(400).json({ error: 'FCM Token missing' });
        return;
    }

    try {
        // await fcmService.saveDeviceToken(userId!, fcmToken, deviceType);
        res.status(200).json({ success: true, message: 'Device mapped.' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
