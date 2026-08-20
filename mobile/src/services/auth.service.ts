import { Browser } from '@capacitor/browser';
import { supabase } from '../lib/supabase';

const MOBILE_REDIRECT =
    'com.vois.vodannounce://login-callback';

export async function signInWithGoogle() {
    const { data, error } =
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: MOBILE_REDIRECT,
                skipBrowserRedirect: true,
                queryParams: {
                    prompt: 'select_account',
                },
            },
        });

    if (error) {
        throw error;
    }

    if (!data.url) {
        throw new Error('Google OAuth URL was not returned');
    }

    await Browser.open({
        url: data.url,
    });
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw error;
    }
}