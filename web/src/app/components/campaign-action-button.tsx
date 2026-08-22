import { useState } from 'react';
import { Trash2, XCircle } from 'lucide-react';
import type { Campaign } from '@shared/types/campaign';
import * as api from '../api/api';
import { ConfirmDialog } from './confirm-dialog';

export function isCampaignActionable(campaign: Campaign | null): boolean {
    return campaign?.status === 'draft' || campaign?.status === 'scheduled';
}

export function CampaignActionButton({
    campaign,
    onDone,
    size = 'sm',
}: {
    campaign: Campaign;
    onDone: () => void;
    size?: 'sm' | 'md';
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const isDraft = campaign.status === 'draft';
    const label = isDraft ? 'Discard' : 'Cancel';
    const Icon = isDraft ? Trash2 : XCircle;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            if (isDraft) {
                await api.deleteCampaign(campaign.id);
            } else {
                await api.cancelCampaign(campaign.id);
            }
            onDone();
        } catch {
            setConfirmOpen(false);
            setLoading(false);
        }
    };

    const sizeClasses = size === 'sm' ? 'px-3.5 py-2 text-xs' : 'px-4 py-2.5 text-sm';

    return (
        <>
            <button
                onClick={() => setConfirmOpen(true)}
                className={`flex items-center gap-1.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors ${sizeClasses}`}
            >
                <Icon size={size === 'sm' ? 13 : 14} /> {label}
            </button>
            <ConfirmDialog
                open={confirmOpen}
                title={isDraft ? 'Discard Campaign?' : 'Cancel Scheduled Campaign?'}
                description={
                    isDraft
                        ? 'This will permanently delete this draft and all its data. This action cannot be undone.'
                        : 'This will cancel the scheduled campaign. Recipients will not receive any notification across email, Teams, or mobile push. This action cannot be undone.'
                }
                confirmLabel={loading ? 'Processing...' : label}
                onConfirm={handleConfirm}
                onCancel={() => {
                    setConfirmOpen(false);
                    setLoading(false);
                }}
            />
        </>
    );
}
