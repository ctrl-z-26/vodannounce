import { env } from '@shared/config/env.js';
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const app = initializeApp({
    credential: cert(env.FCM_SERVICE_ACCOUNT_JSON),
});

export const fcm = getMessaging(app);
