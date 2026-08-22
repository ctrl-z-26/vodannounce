import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
   ArrowRight,
   ChevronLeft,
   Loader2,
   Mail,
   MessageSquare,
   Pencil,
   Smartphone,
   Zap,
} from 'lucide-react';
import type { Campaign } from '@shared/types/campaign';
import * as api from '../api/api';
import { DARK, RED } from '../lib/brand';
import {
   CampaignActionButton,
   isCampaignActionable,
} from '../components/campaign-action-button';
import { StatusBadge } from '../components/badges';

type TabId = 'teams' | 'email' | 'mobile_push';

const TAB_META: Record<TabId, { label: string; hint: string }> = {
   teams: {
      label: 'Teams',
      hint: 'Short, scannable, emoji-led. Optimised for channel posts in #all-staff.',
   },
   email: {
      label: 'Outlook',
      hint: 'Formal email tone. Full context, salutation, sign-off, and structured paragraphs.',
   },
   mobile_push: {
      label: 'Mobile Push',
      hint: 'Ultra-short. Title <=50 chars, body <=100 chars. Tap opens full announcement.',
   },
};

const TAB_ICONS: Record<TabId, typeof MessageSquare> = {
   teams: MessageSquare,
   email: Mail,
   mobile_push: Smartphone,
};

export default function WebContentPreview() {
   const navigate = useNavigate();
   const { id } = useParams<{ id: string }>();
   const [campaign, setCampaign] = useState<Campaign | null>(null);
   const [channel, setChannel] = useState<TabId>('teams');
   const [editing, setEditing] = useState(false);
   const [saving, setSaving] = useState(false);

   // Editable content state
   const [editTeams, setEditTeams] = useState('');
   const [editEmailSubject, setEditEmailSubject] = useState('');
   const [editEmailBody, setEditEmailBody] = useState('');
   const [editNotification, setEditNotification] = useState('');

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
            <Loader2 size={20} className="animate-spin text-slate-400" />
         </div>
      );
   }

   const tabs = (Object.keys(TAB_META) as TabId[]).filter((t) =>
      campaign.channels.includes(t),
   );
   const activeTab = tabs.includes(channel) ? channel : (tabs[0] ?? 'teams');

   const startEditing = () => {
      setEditTeams(campaign.teams_message ?? '');
      setEditEmailSubject(campaign.email_subject ?? campaign.title);
      setEditEmailBody(campaign.email_body ?? '');
      setEditNotification(campaign.notification_text ?? '');
      setEditing(true);
   };

   const handleSave = async () => {
      if (!id) return;
      setSaving(true);
      try {
         const updated = await api.updateCampaign(id, {
            teams_message: editTeams,
            email_subject: editEmailSubject,
            email_body: editEmailBody,
            notification_text: editNotification,
         });
         setCampaign(updated);
         setEditing(false);
      } catch {
         // keep editing open on failure
      } finally {
         setSaving(false);
      }
   };

   const pushTitle = editing
      ? editNotification.slice(0, 50) || campaign.title
      : campaign.title;
   const pushBody = editing ? editNotification : (campaign.notification_text ?? '');

   return (
      <div className="p-5 lg:p-7">
         <div className="max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
               <button
                  onClick={() => navigate(`/campaign/${id}/plan`)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
               >
                  <ChevronLeft size={20} />
               </button>
               <div className="flex-1">
                  <h1 className="text-xl font-bold" style={{ color: DARK }}>
                     Content Preview
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                     AI rewrites each announcement for its channel format
                  </p>
               </div>
               <StatusBadge s={campaign.status} />
               {isCampaignActionable(campaign) && (
                  <CampaignActionButton
                     campaign={campaign}
                     onDone={() => navigate('/campaign/new')}
                  />
               )}
            </div>

            {/* Channel tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-2 overflow-x-auto">
               {tabs.map((t) => {
                  const Icon = TAB_ICONS[t];
                  return (
                     <button
                        key={t}
                        onClick={() => setChannel(t)}
                        className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
                        style={
                           activeTab === t
                              ? {
                                   backgroundColor: 'white',
                                   color: DARK,
                                   boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                }
                              : { color: '#6E6E6E' }
                        }
                     >
                        <Icon size={13} /> {TAB_META[t].label}
                     </button>
                  );
               })}
               {tabs.length === 0 && (
                  <span className="px-3 py-2 text-xs text-slate-400">
                     No channels selected
                  </span>
               )}
            </div>

            {/* Channel format hint */}
            <div className="flex items-center gap-2 mb-4 px-1">
               <Zap size={12} style={{ color: RED }} className="flex-shrink-0" />
               <p className="text-xs text-slate-400">
                  <span className="font-bold" style={{ color: RED }}>
                     AI format rule:
                  </span>{' '}
                  {TAB_META[activeTab].hint}
               </p>
            </div>

            {/* Content panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
               {/* Teams */}
               {activeTab === 'teams' && (
                  <div className="p-5">
                     {editing ? (
                        <textarea
                           value={editTeams}
                           onChange={(e) => setEditTeams(e.target.value)}
                           rows={8}
                           className="w-full text-sm font-semibold bg-[#F4F4F4] border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-400 resize-none"
                           style={{ color: DARK }}
                        />
                     ) : (
                        <div
                           className="rounded-xl p-4 text-white"
                           style={{ backgroundColor: DARK }}
                        >
                           <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                                 IT
                              </div>
                              <div>
                                 <div className="text-sm font-bold">
                                    IT Communications · #all-staff
                                 </div>
                                 <div className="text-xs text-white/50">Just now</div>
                              </div>
                           </div>
                           <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                              {campaign.teams_message ?? '—'}
                           </pre>
                        </div>
                     )}
                  </div>
               )}

               {/* Outlook */}
               {activeTab === 'email' && (
                  <div className="p-5">
                     <div className="border border-slate-200 rounded-xl overflow-hidden">
                         <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                            <span className="text-xs text-slate-500 flex-shrink-0">Subject:</span>
                            {editing ? (
                               <input
                                  value={editEmailSubject}
                                  onChange={(e) => setEditEmailSubject(e.target.value)}
                                  className="flex-1 min-w-0 font-bold bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-red-400"
                                  style={{ color: DARK }}
                               />
                            ) : (
                               <span className="flex-1 min-w-0 font-bold text-xs" style={{ color: DARK }}>
                                  {campaign.email_subject ?? campaign.title}
                               </span>
                            )}
                         </div>
                        <div className="p-4">
                           {editing ? (
                              <textarea
                                 value={editEmailBody}
                                 onChange={(e) => setEditEmailBody(e.target.value)}
                                 rows={12}
                                 className="w-full text-sm font-semibold bg-[#F4F4F4] border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-400 resize-none"
                                 style={{ color: DARK }}
                              />
                           ) : (
                              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-700">
                                 {campaign.email_body ?? '—'}
                              </pre>
                           )}
                        </div>
                     </div>
                  </div>
               )}

               {/* Push */}
               {activeTab === 'mobile_push' && (
                  <div className="p-5">
                     <div className="flex justify-center mb-4">
                        <div className="w-80 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                           <div
                              className="px-4 py-2.5 flex items-center gap-2"
                              style={{ backgroundColor: DARK }}
                           >
                              <img
                                 src="/vodannounce.svg"
                                 width={20}
                                 height={20}
                                 alt="Vodannounce"
                              />
                              <span className="text-white text-xs font-bold">
                                 Vodannounce — VOIS
                              </span>
                              <span className="text-white/40 text-xs ml-auto">now</span>
                           </div>
                           <div className="p-4">
                              <p
                                 className="text-sm font-bold mb-1.5"
                                 style={{ color: DARK }}
                              >
                                 {editing ? (
                                    <input
                                       value={editNotification}
                                       onChange={(e) =>
                                          setEditNotification(e.target.value)
                                       }
                                       className="w-full bg-[#F4F4F4] border border-slate-200 rounded px-2 py-0.5 text-sm focus:outline-none focus:border-red-400"
                                    />
                                 ) : (
                                    pushTitle
                                 )}
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                 {editing ? (
                                    <textarea
                                       value={editNotification}
                                       onChange={(e) =>
                                          setEditNotification(e.target.value)
                                       }
                                       rows={3}
                                       className="w-full text-xs bg-[#F4F4F4] border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-red-400 resize-none"
                                    />
                                 ) : (
                                    pushBody || '—'
                                 )}
                              </p>
                              <div className="mt-3 flex gap-2">
                                 <button className="btn-primary flex-1 py-1.5 text-xs font-bold rounded-lg">
                                    Acknowledge
                                 </button>
                                 <button className="flex-1 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg">
                                    View Details
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs">
                        <div className="bg-slate-50 rounded-xl p-3">
                           <p className="text-slate-400 font-bold mb-1">Title length</p>
                           <p
                              className="font-bold"
                              style={{ color: pushTitle.length > 50 ? RED : '#16a34a' }}
                           >
                              {pushTitle.length} / 50 chars
                           </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                           <p className="text-slate-400 font-bold mb-1">Body length</p>
                           <p
                              className="font-bold"
                              style={{ color: pushBody.length > 100 ? RED : '#16a34a' }}
                           >
                              {pushBody.length} / 100 chars
                           </p>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* Bottom actions */}
            <div className="flex gap-3 justify-end">
               {isCampaignActionable(campaign) && (
                  <>
                     {editing ? (
                        <>
                           <button
                              onClick={handleSave}
                              disabled={saving}
                              className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                           >
                              {saving ? 'Saving...' : 'Done'}
                           </button>
                           <button
                              onClick={() => setEditing(false)}
                              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                           >
                              Cancel
                           </button>
                        </>
                     ) : (
                        <>
                           <button
                              onClick={startEditing}
                              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                           >
                              <Pencil size={14} /> Edit Content
                           </button>
                           <button
                              onClick={() => navigate(`/campaign/${id}/approve`)}
                              className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                           >
                              Proceed to Approval <ArrowRight size={15} />
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
