import { createApiClient } from '@shared/api/client';
import type {
    AnalyzeAnnouncementRequest,
    Campaign,
    CampaignRecipient,
} from '@shared/types/campaign';
import { supabase } from '../lib/supabase';

const BASE_URL =
    (import.meta.env.VITE_VODANNOUNCE_API_URL as string) ?? 'http://localhost:3000';

const api = createApiClient({
    baseUrl: BASE_URL,
    getToken: async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        return session?.access_token ?? null;
    },
    // A 401 means the Supabase session is no longer valid; signing out lets the
    // app's onAuthStateChange listener reset the UI to the login screen.
    onUnauthorized: () => {
        void supabase.auth.signOut();
    },
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
}

export async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getSessionEmail(): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.email ?? null;
}

// ─── Campaign routes ──────────────────────────────────────────────────────────

// GET /campaigns
export async function getCampaigns(): Promise<Campaign[]> {
    const res = await api.get<Campaign[]>('/campaigns');
    return res.data;
}

// GET /campaigns/:id
export async function getCampaign(id: string): Promise<Campaign> {
    const res = await api.get<Campaign>(`/campaigns/${id}`);
    return res.data;
}

// GET /campaigns/:id/recipients
export async function getRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    const res = await api.get<CampaignRecipient[]>(`/campaigns/${campaignId}/recipients`);
    return res.data;
}

// POST /api/campaigns/analyze
export async function analyzeCampaign(
    data: AnalyzeAnnouncementRequest,
): Promise<Campaign> {
    const res = await api.post<Campaign>('/api/campaigns/analyze', data);
    return res.data;
}

// POST /campaigns/:id/approve
export async function approveCampaign(id: string): Promise<Campaign> {
    const res = await api.post<Campaign>(`/campaigns/${id}/approve`);
    return res.data;
}
