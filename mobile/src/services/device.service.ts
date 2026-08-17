import { supabase } from '../lib/supabase';

const BACKEND_URL = 'http://10.0.2.2:3000';

export async function registerDevice(
    fcmToken: string,
): Promise<void> {

    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    if (!session) {
        throw new Error(
            'User must be logged in before registering device'
        );
    }

    console.log(
        'Sending device registration to:',
        `${BACKEND_URL}/api/fcm/register`
    );

    const response = await fetch(
        `${BACKEND_URL}/api/fcm/register`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
                fcmToken,
                devicePlatform: 'android',
            }),
        },
    );

    const text = await response.text();

    console.log('Backend status:', response.status);
    console.log('Backend response:', text);

    if (!response.ok) {
        throw new Error(
            `Backend ${response.status}: ${text}`
        );
    }

    console.log(
        'Device registered successfully'
    );
}

export async function sendTestNotification(): Promise<void> {

    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    if (!session) {
        throw new Error('User must be logged in');
    }

    const response = await fetch(
        `${BACKEND_URL}/api/fcm/test`,
        {
            method: 'POST',

            headers: {
                Authorization:
                    `Bearer ${session.access_token}`,

                'Content-Type':
                    'application/json',
            },
        }
    );

    const text = await response.text();

    console.log(
        'Test backend status:',
        response.status
    );

    console.log(
        'Test backend response:',
        text
    );

    if (!response.ok) {
        throw new Error(
            `Backend ${response.status}: ${text}`
        );
    }

    console.log(
        'Test notification sent successfully'
    );
}