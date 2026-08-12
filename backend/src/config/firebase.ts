import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import serviceAccount from './vodannounce-firebase-adminsdk.json' with { type: 'json' };

const app = initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
});

export const fcm = getMessaging(app);
