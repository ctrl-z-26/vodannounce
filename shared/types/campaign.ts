export type UrgencyLevel = 'NORMAL' | 'IMPORTANT' | 'CRITICAL';

export interface Campaign {
    id: string;
    sender_id: string;
    raw_prompt: string;
    urgency: UrgencyLevel;
    status: 'DRAFT' | 'APPROVED' | 'DISPATCHED';
    created_at: string;
}

export interface MultiChannelContent {
    email: { subject: string; body_html: string };
    teams: { title: string; body_markdown: string };
    mobile_push: { title: string; body: string };
    sms: { body: string };
}
