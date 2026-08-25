import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import type { Campaign, CampaignRecipient } from '@shared/types/campaign';
import * as api from '../api/api';
import { PriorityBadge, StatusBadge } from '../components/badges';
import { fmtDate } from '../lib/format';
import { DARK } from '../lib/brand';

export default function WebCampaignDetail() {
   const navigate = useNavigate();
   const { id } = useParams<{ id: string }>();
   const [campaign, setCampaign] = useState<Campaign | null>(null);
   const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);

   useEffect(() => {
      if (!id) return;
      api.getCampaign(id)
         .then(setCampaign)
         .catch(() => setCampaign(null));
      api.getRecipients(id)
         .then(setRecipients)
         .catch(() => setRecipients([]));
   }, [id]);

   if (!id) return null;
   if (!campaign) {
      return (
         <div className="p-5 lg:p-7">
            <p className="text-sm text-slate-400">Loading announcement…</p>
         </div>
      );
   }

   const total = recipients.length;
   const delivered = recipients.filter((r) => r.delivery_status !== 'failed').length;
   const failed = total - delivered;
   const acked = recipients.filter((r) => r.read_at).length;
   const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

   return (
      <div className="p-5 lg:p-7">
         <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
               <button
                  onClick={() => navigate('/history')}
                  className="text-slate-400 hover:text-slate-600"
               >
                  <ChevronLeft size={20} />
               </button>
               <div>
                  <h1 className="text-xl font-bold" style={{ color: DARK }}>
                     Announcement Detail
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">{campaign.title}</p>
               </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
               <div className="flex items-start justify-between">
                  <div className="flex gap-2 flex-wrap">
                     <PriorityBadge p={campaign.priority} />
                     <StatusBadge s={campaign.status} />
                  </div>
                  <span className="text-xs text-slate-400">
                     {fmtDate(campaign.created_at)}
                  </span>
               </div>
               <h2 className="text-lg font-bold" style={{ color: DARK }}>
                  {campaign.title}
               </h2>
               <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {campaign.original_text}
               </p>
               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  {[
                     { label: 'Total Sent', value: total.toLocaleString() },
                     {
                        label: 'Delivered',
                        value: `${delivered.toLocaleString()} (${pct(delivered)}%)`,
                     },
                     {
                        label: 'Acknowledged',
                        value: `${acked.toLocaleString()} (${pct(acked)}%)`,
                     },
                     {
                        label: 'Failed',
                        value: `${failed.toLocaleString()} (${pct(failed)}%)`,
                     },
                  ].map(({ label, value }) => (
                     <div key={label}>
                        <p className="text-xs text-slate-400 font-bold">{label}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: DARK }}>
                           {value}
                        </p>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
}
