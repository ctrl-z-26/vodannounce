import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import * as api from '../api/api';
import { DARK } from '../lib/brand';
import { ConfirmDialog } from './confirm-dialog';

export function DiscardCampaignButton({
   campaignId,
   onDiscarded,
   size = 'sm',
}: {
   campaignId: string;
   onDiscarded: () => void;
   size?: 'sm' | 'md';
}) {
   const [confirmOpen, setConfirmOpen] = useState(false);

   const handleDiscard = async () => {
      try {
         await api.deleteCampaign(campaignId);
         onDiscarded();
      } catch {
         setConfirmOpen(false);
      }
   };

   const sizeClasses = size === 'sm' ? 'px-3.5 py-2 text-xs' : 'px-4 py-2.5 text-sm';

   return (
      <>
         <button
            onClick={() => setConfirmOpen(true)}
            className={`flex items-center gap-1.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors ${sizeClasses}`}
         >
            <Trash2 size={size === 'sm' ? 13 : 14} /> Discard
         </button>
         <ConfirmDialog
            open={confirmOpen}
            title="Discard Campaign?"
            description="This will permanently delete this campaign and all its data. This action cannot be undone."
            confirmLabel="Discard"
            onConfirm={handleDiscard}
            onCancel={() => setConfirmOpen(false)}
         />
      </>
   );
}
