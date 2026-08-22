import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
   AlertTriangle,
   Calendar,
   Check,
   CheckCircle,
   ChevronLeft,
   Clock,
   Pencil,
   Send,
   Users,
} from 'lucide-react';
import type { Campaign } from '@shared/types/campaign';
import * as api from '../api/api';
import { PriorityBadge, StatusBadge } from '../components/badges';
import { DiscardCampaignButton } from '../components/discard-campaign-button';
import { CHANNEL_META } from '../lib/channels';
import { fmtDate, fmtDateTime } from '../lib/format';
import { DARK, RED } from '../lib/brand';

export default function WebApproval() {
   const navigate = useNavigate();
   const { id } = useParams<{ id: string }>();
   const [campaign, setCampaign] = useState<Campaign | null>(null);
   const [checked, setChecked] = useState(false);
   const [sending, setSending] = useState(false);
   const [error, setError] = useState('');

   useEffect(() => {
      if (!id) return;
      api.getCampaign(id)
         .then(setCampaign)
         .catch(() => setCampaign(null));
   }, [id]);

   if (!id) return null;

   const audience = Array.from(
      new Set((campaign?.targeting ?? []).flatMap((cell) => cell.map((t) => t.name))),
   ).join(', ');

   const handleApprove = async () => {
      setError('');
      setSending(true);
      try {
         await api.approveCampaign(id);
         navigate(`/campaign/${id}/monitor`);
      } catch (e) {
         setError(e instanceof Error ? e.message : 'Approval failed.');
         setSending(false);
      }
   };

   return (
      <div className="p-5 lg:p-7">
         <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
               <button
                  onClick={() => navigate(`/campaign/${id}/preview`)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
               >
                  <ChevronLeft size={20} />
               </button>
               <div>
                  <h1 className="text-xl font-bold" style={{ color: DARK }}>
                     Review & Approve
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                     Final review before sending to recipients
                  </p>
               </div>
            </div>

            {!campaign ? (
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <p className="text-sm text-slate-400">Loading campaign…</p>
               </div>
            ) : (
               <>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
                     <div className="flex items-start justify-between mb-4">
                        <div>
                           <PriorityBadge p={campaign.priority} />
                           <h2 className="text-lg font-bold mt-2" style={{ color: DARK }}>
                              {campaign.title}
                           </h2>
                        </div>
                        <StatusBadge s={campaign.status} />
                     </div>
                     <p
                        className="text-sm text-slate-600 mb-5 leading-relaxed border-l-4 pl-3 whitespace-pre-wrap"
                        style={{ borderLeftColor: RED }}
                     >
                        {campaign.original_text}
                     </p>
                     <div className="grid grid-cols-2 gap-4">
                        {[
                           {
                              label: 'Audience',
                              value: audience || '—',
                              icon: Users,
                           },
                           {
                              label: 'Channels',
                              value:
                                 campaign.channels
                                    .map((ch) => CHANNEL_META[ch].short)
                                    .join(', ') || '—',
                              icon: Clock,
                           },
                           {
                              label: 'Schedule',
                              value: campaign.scheduled_at
                                 ? fmtDateTime(campaign.scheduled_at)
                                 : 'Not scheduled',
                              icon: Calendar,
                           },
                           {
                              label: 'Created',
                              value: fmtDate(campaign.created_at),
                              icon: CheckCircle,
                           },
                        ].map(({ label, value, icon: Icon }) => (
                           <div key={label} className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-[#F4F4F4] rounded-lg flex items-center justify-center flex-shrink-0">
                                 <Icon size={14} className="text-slate-500" />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-xs text-slate-400 font-bold">
                                    {label}
                                 </p>
                                 <p
                                    className="text-sm font-bold break-words"
                                    style={{ color: DARK }}
                                 >
                                    {value}
                                 </p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
                     <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={16} className="text-amber-600" />
                        <p className="text-sm font-bold text-amber-700">
                           Before you send
                        </p>
                     </div>
                     <div className="space-y-2.5">
                        {[
                           'I have reviewed the announcement content and it is accurate',
                           'The audience selection is correct for this communication',
                           'The schedule and deadline have been verified',
                        ].map((item, i) => (
                           <div key={i} className="flex items-start gap-2.5">
                              <div className="w-4 h-4 rounded border mt-0.5 flex-shrink-0 flex items-center justify-center bg-amber-500 border-amber-500">
                                 <Check size={10} className="text-white" />
                              </div>
                              <span className="text-sm text-amber-700">{item}</span>
                           </div>
                        ))}
                        <label
                           className="flex items-start gap-2.5 cursor-pointer"
                           onClick={() => setChecked((c) => !c)}
                        >
                           <div
                              className={`w-4 h-4 rounded border mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors ${checked ? 'bg-amber-500 border-amber-500' : 'border-amber-300 bg-white'}`}
                           >
                              {checked && <Check size={10} className="text-white" />}
                           </div>
                           <span className="text-sm font-bold text-amber-700">
                              I acknowledge this communication will be delivered to the
                              selected audience across the chosen channels
                           </span>
                        </label>
                     </div>
                  </div>

                  {error && (
                     <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-5">
                        <AlertTriangle
                           size={13}
                           style={{ color: RED }}
                           className="flex-shrink-0"
                        />
                        <p className="text-xs text-red-700 font-semibold">{error}</p>
                     </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                     <DiscardCampaignButton
                        campaignId={id}
                        onDiscarded={() => navigate('/campaign/new')}
                        size="md"
                     />
                     <button
                        onClick={() => navigate(`/campaign/${id}/preview`)}
                        className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                     >
                        <Pencil size={14} /> Edit
                     </button>
                     <button
                        onClick={handleApprove}
                        disabled={!checked || sending}
                        className="btn-primary flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                     >
                        <Send size={14} /> Approve & Send
                     </button>
                  </div>
               </>
            )}
         </div>
      </div>
   );
}
