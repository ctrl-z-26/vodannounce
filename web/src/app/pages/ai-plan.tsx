import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
   AlertTriangle,
   ArrowRight,
   Calendar,
   Check,
   CheckCircle,
   CheckSquare,
   ChevronLeft,
   FileText,
   Pencil,
   Radio,
   Users,
} from 'lucide-react';
import type { Campaign } from '@shared/types/campaign';
import * as api from '../api/api';
import { CHANNEL_META, priorityLabel } from '../lib/channels';
import { fmtDateTime } from '../lib/format';
import { DARK, HOVER_RED, RED } from '../lib/brand';

const URGENCY_TEXT: Record<string, string> = {
   critical: 'Critical — Immediate Action Required',
   important: 'Important — Timely Action Required',
   normal: 'Normal — For Your Awareness',
};

export default function WebAIPlan() {
   const navigate = useNavigate();
   const { id } = useParams<{ id: string }>();
   const [campaign, setCampaign] = useState<Campaign | null>(null);
   const [editing, setEditing] = useState(false);

   useEffect(() => {
      if (!id) return;
      api.getCampaign(id)
         .then(setCampaign)
         .catch(() => setCampaign(null));
   }, [id]);

   if (!id) return null;
   if (!campaign) {
      return (
         <div className="p-5 lg:p-7">
            <p className="text-sm text-slate-400">Loading campaign…</p>
         </div>
      );
   }

   const audience = Array.from(
      new Set(
         campaign.targeting.flatMap((cell) =>
            cell.map((t) => (t.type === 'group' ? t.name : `Location: ${t.name}`)),
         ),
      ),
   );
   const channelRows = campaign.channels.map((ch) => CHANNEL_META[ch]);

   const cards = [
      {
         label: 'Urgency Classification',
         value: URGENCY_TEXT[campaign.priority] ?? priorityLabel(campaign.priority),
         icon: AlertTriangle,
         iconClass: 'text-red-600 bg-red-50',
      },
      {
         label: 'Topic',
         value: campaign.title,
         icon: FileText,
         iconClass: 'text-blue-600 bg-blue-50',
      },
      {
         label: 'Effective Date & Time',
         value: campaign.scheduled_at
            ? fmtDateTime(campaign.scheduled_at)
            : 'Not scheduled',
         icon: Calendar,
         iconClass: 'text-amber-600 bg-amber-50',
      },
      {
         label: 'Required Action',
         value: campaign.notification_text ?? campaign.original_text,
         icon: CheckSquare,
         iconClass: 'text-green-600 bg-green-50',
      },
   ];

   return (
      <div className="p-5 lg:p-7">
         <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
               <button
                  onClick={() => navigate('/campaign/new')}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
               >
                  <ChevronLeft size={20} />
               </button>
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                        <CheckCircle size={12} className="text-green-600" />
                        <span className="text-xs font-bold text-green-700">
                           AI Analysis Complete
                        </span>
                     </div>
                  </div>
                  <h1 className="text-xl font-bold" style={{ color: DARK }}>
                     AI Communication Plan
                  </h1>
               </div>
               <button
                  onClick={() => setEditing((e) => !e)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border transition-colors"
                  style={
                     editing
                        ? { backgroundColor: DARK, color: 'white', borderColor: DARK }
                        : { borderColor: '#E2E8F0', color: DARK }
                  }
               >
                  <Pencil size={14} /> {editing ? 'Done' : 'Edit'}
               </button>
            </div>

            <div
               className="rounded-2xl p-5 mb-5 flex items-center justify-between"
               style={{ backgroundColor: DARK }}
            >
               <div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-1">
                     Campaign
                  </p>
                  <p className="text-white font-bold text-lg">{campaign.title}</p>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-xl">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-xs font-bold uppercase tracking-wide">
                     {priorityLabel(campaign.priority)}
                  </span>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
               <div className="space-y-4">
                  {cards.map(({ label, value, icon: Icon, iconClass }) => (
                     <div
                        key={label}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
                     >
                        <div className="flex items-start gap-3">
                           <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}
                           >
                              <Icon size={16} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                                 {label}
                              </p>
                              {editing ? (
                                 <input
                                    defaultValue={value}
                                    className="w-full text-sm font-semibold bg-[#F4F4F4] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                                    style={{ color: DARK }}
                                 />
                              ) : (
                                 <p
                                    className="text-sm font-bold break-words"
                                    style={{ color: DARK }}
                                 >
                                    {value}
                                 </p>
                              )}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>

               <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                     <div className="flex items-center gap-2 mb-3">
                        <Users size={15} style={{ color: DARK }} />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                           Recommended Audience
                        </p>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {audience.length === 0 && (
                           <span className="text-xs text-slate-400">
                              No targets selected
                           </span>
                        )}
                        {audience.map((a) => (
                           <span
                              key={a}
                              className="px-2.5 py-1 border text-xs font-bold rounded-lg"
                              style={{
                                 backgroundColor: `${DARK}08`,
                                 borderColor: `${DARK}20`,
                                 color: DARK,
                              }}
                           >
                              {a}
                           </span>
                        ))}
                     </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                     <div className="flex items-center gap-2 mb-3">
                        <Radio size={15} style={{ color: DARK }} />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                           Recommended Channels
                        </p>
                     </div>
                     <div className="space-y-2.5">
                        {channelRows.length === 0 && (
                           <span className="text-xs text-slate-400">
                              No channels selected
                           </span>
                        )}
                        {channelRows.map(({ icon: Icon, name }, i) => (
                           <div key={name} className="flex items-center gap-3">
                              <div
                                 className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    ['bg-indigo-50', 'bg-blue-50', 'bg-green-50'][i % 3]
                                 }`}
                              >
                                 <Icon
                                    size={13}
                                    className={
                                       [
                                          'text-indigo-600',
                                          'text-blue-600',
                                          'text-green-600',
                                       ][i % 3]
                                    }
                                 />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <span
                                    className="text-sm font-bold"
                                    style={{ color: DARK }}
                                 >
                                    {name}
                                 </span>
                              </div>
                              <Check size={14} className="text-green-500 flex-shrink-0" />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex gap-3">
               <button
                  onClick={() => navigate(`/campaign/${id}/preview`)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-white rounded-2xl font-bold transition-colors"
                  style={{ backgroundColor: RED }}
                  onMouseEnter={(e) =>
                     (e.currentTarget.style.backgroundColor = HOVER_RED)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = RED)}
               >
                  Use These Recommendations <ArrowRight size={16} />
               </button>
               <button
                  onClick={() => navigate('/campaign/new')}
                  className="px-6 py-3.5 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors text-sm"
               >
                  Modify
               </button>
            </div>
         </div>
      </div>
   );
}
