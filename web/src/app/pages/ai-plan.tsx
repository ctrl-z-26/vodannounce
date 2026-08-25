import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
   AlertTriangle,
   Calendar,
   Check,
   CheckCircle,
   ChevronLeft,
   FileText,
   Pencil,
   Users,
} from 'lucide-react';
import type {
   Campaign,
   TargetingExpression,
   TargetContext,
} from '@shared/types/campaign';
import * as api from '../api/api';
import {
   CHANNEL_META,
   CHANNEL_ORDER,
   channelIconStyle,
   priorityLabel,
} from '../lib/channels';
import { fmtDateTime } from '../lib/format';
import { DARK } from '../lib/brand';
import {
   CampaignActionButton,
   isCampaignActionable,
} from '../components/campaign-action-button';
import { StatusBadge } from '../components/badges';
import { TargetingEditor } from '../components/targeting-editor';

export default function WebAIPlan() {
   const navigate = useNavigate();
   const { id } = useParams<{ id: string }>();
   const [campaign, setCampaign] = useState<Campaign | null>(null);
   const [editing, setEditing] = useState(false);
   const [saving, setSaving] = useState(false);

   // Editable form state
   const [editTitle, setEditTitle] = useState('');
   const [editPriority, setEditPriority] = useState<string>('normal');
   const [editDate, setEditDate] = useState('');
   const [editTime, setEditTime] = useState('');
   const [editImmediate, setEditImmediate] = useState(false);
   const [editChannels, setEditChannels] = useState<string[]>([]);
   const [editTargeting, setEditTargeting] = useState<TargetingExpression>([]);

   // Target context for audience picker
   const [targetContext, setTargetContext] = useState<TargetContext>({
      groups: [],
      locations: [],
   });

   useEffect(() => {
      if (!id) return;
      api.getCampaign(id)
         .then(setCampaign)
         .catch(() => setCampaign(null));
      api.getTargetContext()
         .then(setTargetContext)
         .catch(() => {});
   }, [id]);

   const startEditing = () => {
      if (!campaign) return;
      setEditTitle(campaign.title);
      setEditPriority(campaign.priority);
      if (campaign.scheduled_at) {
         const d = new Date(campaign.scheduled_at);
         setEditDate(d.toISOString().slice(0, 10));
         setEditTime(d.toTimeString().slice(0, 5));
         setEditImmediate(false);
      } else {
         setEditDate('');
         setEditTime('');
         setEditImmediate(true);
      }
      setEditChannels([...campaign.channels]);
      setEditTargeting(JSON.parse(JSON.stringify(campaign.targeting)));
      setEditing(true);
   };

   const handleSave = async () => {
      if (!id || !campaign) return;
      if (!editImmediate) {
         const scheduled = new Date(`${editDate}T${editTime}:00`);
         if (scheduled <= new Date()) return;
      }
      setSaving(true);
      try {
         const scheduled_at = editImmediate ? null : `${editDate}T${editTime}:00`;
         const updated = await api.updateCampaign(id, {
            title: editTitle,
            priority: editPriority as Campaign['priority'],
            channels: editChannels as Campaign['channels'],
            targeting: editTargeting,
            scheduled_at,
         });
         setCampaign(updated);
         setEditing(false);
      } catch {
         // keep editing open on failure
      } finally {
         setSaving(false);
      }
   };

   const toggleChannel = (ch: string) => {
      setEditChannels((prev) =>
         prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
      );
   };

   if (!id) return null;
   if (!campaign) {
      return (
         <div className="p-5 lg:p-7">
            <p className="text-sm text-slate-400">Loading announcement...</p>
         </div>
      );
   }

   return (
      <div className="p-5 lg:p-7">
         <div className="max-w-4xl">
            {/* Header */}
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
                     <StatusBadge s={campaign.status} />
                  </div>
                  <h1 className="text-xl font-bold" style={{ color: DARK }}>
                     AI Communication Plan
                  </h1>
               </div>
               {isCampaignActionable(campaign) && (
                  <CampaignActionButton
                     campaign={campaign}
                     onDone={() => navigate('/campaign/new')}
                  />
               )}
            </div>

            {/* Campaign banner */}
            <div
               className="rounded-2xl p-5 mb-5 flex items-center justify-between"
               style={{ backgroundColor: DARK }}
            >
               <div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-1">
                      Announcement
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
               {/* Left column — editable cards */}
               <div className="space-y-4">
                  {/* Topic */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                     <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50">
                           <FileText size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                              Topic
                           </p>
                           {editing ? (
                              <input
                                 value={editTitle}
                                 onChange={(e) => setEditTitle(e.target.value)}
                                 className="w-full text-sm font-semibold bg-[#F4F4F4] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-400"
                                 style={{ color: DARK }}
                              />
                           ) : (
                              <p
                                 className="text-sm font-bold break-words"
                                 style={{ color: DARK }}
                              >
                                 {campaign.title}
                              </p>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Urgency */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                     <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
                           <AlertTriangle size={16} className="text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                              Urgency
                           </p>
                           {editing ? (
                              <select
                                 value={editPriority}
                                 onChange={(e) => setEditPriority(e.target.value)}
                                 className="w-full text-sm font-semibold bg-[#F4F4F4] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-400"
                                 style={{ color: DARK }}
                              >
                                 <option value="normal">Normal</option>
                                 <option value="important">Important</option>
                                 <option value="critical">Critical</option>
                              </select>
                           ) : (
                              <p
                                 className="text-sm font-bold break-words"
                                 style={{ color: DARK }}
                              >
                                 {priorityLabel(campaign.priority)}
                              </p>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Effective Date & Time */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                     <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50">
                           <Calendar size={16} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                              Effective Date & Time
                           </p>
                           {editing ? (
                              <div className="space-y-2">
                                 <label className="flex items-center gap-2 cursor-pointer">
                                    <div
                                       className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${editImmediate ? 'bg-red-500 border-red-500' : 'border-slate-300 bg-white'}`}
                                       onClick={() => setEditImmediate(!editImmediate)}
                                    >
                                       {editImmediate && (
                                          <span className="text-white text-[10px] font-bold">
                                             ✓
                                          </span>
                                       )}
                                    </div>
                                    <span
                                       className="text-xs font-bold"
                                       style={{ color: DARK }}
                                    >
                                       Send immediately — do not schedule
                                    </span>
                                 </label>
                                 <div
                                    className={`flex gap-2 ${editImmediate ? 'opacity-40 pointer-events-none' : ''}`}
                                 >
                                    <input
                                       type="date"
                                       value={editDate}
                                       onChange={(e) => setEditDate(e.target.value)}
                                       disabled={editImmediate}
                                       className="flex-1 text-sm font-semibold bg-[#F4F4F4] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-400 disabled:cursor-not-allowed"
                                       style={{ color: DARK }}
                                    />
                                    <input
                                       type="time"
                                       value={editTime}
                                       onChange={(e) => setEditTime(e.target.value)}
                                       disabled={editImmediate}
                                       className="w-28 text-sm font-semibold bg-[#F4F4F4] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-400 disabled:cursor-not-allowed"
                                       style={{ color: DARK }}
                                    />
                                 </div>
                              </div>
                           ) : (
                              <p
                                 className="text-sm font-bold break-words"
                                 style={{ color: DARK }}
                              >
                                 {campaign.scheduled_at
                                    ? fmtDateTime(campaign.scheduled_at)
                                    : 'Immediate'}
                              </p>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Channels */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                     <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-50">
                           <Check size={16} className="text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                              Channels
                           </p>
                           <div className="space-y-2">
                              {CHANNEL_ORDER.map((ch, i) => {
                                 const meta = CHANNEL_META[ch];
                                 const Icon = meta.icon;
                                 const style = channelIconStyle(i);
                                 const isActive = editing
                                    ? editChannels.includes(ch)
                                    : campaign.channels.includes(ch);
                                 return (
                                    <div key={ch} className="flex items-center gap-3">
                                       <div
                                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}
                                       >
                                          <Icon size={13} className={style.text} />
                                       </div>
                                       <span
                                          className="text-sm font-bold flex-1"
                                          style={{ color: DARK }}
                                       >
                                          {meta.name}
                                       </span>
                                       {editing ? (
                                          <label
                                             className="flex items-center cursor-pointer"
                                             onClick={() => toggleChannel(ch)}
                                          >
                                             <div
                                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-red-500 border-red-500' : 'border-slate-300 bg-white'}`}
                                             >
                                                {isActive && (
                                                   <Check
                                                      size={10}
                                                      className="text-white"
                                                   />
                                                )}
                                             </div>
                                          </label>
                                       ) : (
                                          isActive && (
                                             <Check
                                                size={14}
                                                className="text-green-500 flex-shrink-0"
                                             />
                                          )
                                       )}
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right column — audience */}
               <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                     <div className="flex items-center gap-2 mb-3">
                        <Users size={15} style={{ color: DARK }} />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                           Audience
                        </p>
                     </div>
                     {editing ? (
                        <TargetingEditor
                           value={editTargeting}
                           onChange={setEditTargeting}
                           targetContext={targetContext}
                        />
                     ) : campaign.targeting.length === 0 ? (
                        <p className="text-xs text-slate-400">No targets selected</p>
                     ) : (
                        <div className="space-y-3">
                           {campaign.targeting.map((cell, cellIdx) => (
                              <div key={cellIdx}>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Group {cellIdx + 1}
                                 </p>
                                 <div className="flex flex-wrap gap-1.5">
                                    {cell.map((target) => (
                                       <span
                                          key={`${target.type}-${target.name}`}
                                          className="px-2.5 py-1 border text-xs font-bold rounded-lg"
                                          style={{
                                             backgroundColor: `${DARK}08`,
                                             borderColor: `${DARK}20`,
                                             color: DARK,
                                          }}
                                       >
                                          {target.name}
                                       </span>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Bottom actions */}
            <div className="flex gap-3">
               {isCampaignActionable(campaign) && (
                  <>
                     {editing ? (
                        <>
                           <button
                              onClick={handleSave}
                              disabled={saving}
                              className="btn-primary flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold disabled:opacity-40"
                           >
                              {saving ? 'Saving...' : 'Done'}
                           </button>
                           <button
                              onClick={() => setEditing(false)}
                              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold border transition-colors"
                              style={{ borderColor: '#E2E8F0', color: DARK }}
                           >
                              Cancel
                           </button>
                        </>
                     ) : (
                        <>
                           <button
                              onClick={() => navigate(`/campaign/${id}/preview`)}
                              className="btn-primary flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold"
                           >
                              Use These Recommendations
                           </button>
                           <button
                              onClick={startEditing}
                              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold border transition-colors"
                              style={{ borderColor: '#E2E8F0', color: DARK }}
                           >
                              <Pencil size={14} /> Edit
                           </button>
                        </>
                     )}
                  </>
               )}
            </div>
         </div>
      </div>
   );
}
