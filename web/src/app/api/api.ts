import { createApiClient } from '@shared/api/client';
import type {
    AnalyzeAnnouncementRequest,
    Campaign,
    CampaignRecipient,
    TargetContext,
    UpdateCampaignRequest,
} from '@shared/types/campaign';
import { supabase } from '../lib/supabase';

const BASE_URL =
    (import.meta.env.VITE_VODANNOUNCE_API_URL as string) ?? 'http://localhost:3000/api';

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

// POST /campaigns/analyze
export async function analyzeCampaign(
    data: AnalyzeAnnouncementRequest,
): Promise<Campaign> {
    const res = await api.post<Campaign>('/campaigns/analyze', data);
    return res.data;
}

// POST /campaigns/:id/approve
export async function approveCampaign(id: string): Promise<Campaign> {
    const res = await api.post<Campaign>(`/campaigns/${id}/approve`);
    return res.data;
}

// DELETE /campaigns/:id
export async function deleteCampaign(id: string): Promise<void> {
    await api.delete(`/campaigns/${id}`);
}

// PATCH /campaigns/:id/cancel
export async function cancelCampaign(id: string): Promise<Campaign> {
    const res = await api.patch<Campaign>(`/campaigns/${id}/cancel`);
    return res.data;
}

// PATCH /campaigns/:id
export async function updateCampaign(
    id: string,
    updates: UpdateCampaignRequest,
): Promise<Campaign> {
    const res = await api.patch<Campaign>(`/campaigns/${id}`, updates);
    return res.data;
}

// GET /campaigns/target-context
export async function getTargetContext(): Promise<TargetContext> {
    const res = await api.get<TargetContext>('/campaigns/target-context');
    return res.data;
}

export async function sendTeamsTestMessage(
    microsoftAccessToken: string,
) {

    const response = await fetch(
        'http://localhost:3000/api/teams/test',
        {
            method: 'POST',

            headers: {
                Authorization:
                    `Bearer ${microsoftAccessToken}`,

                'Content-Type':
                    'application/json',
            },
        },
    );


    const data =
        await response.json();


    if (!response.ok) {
        throw new Error(
            data.error ||
            'Teams delivery failed',
        );
    }


    return data;
}