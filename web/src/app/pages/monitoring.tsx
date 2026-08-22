import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Bell, Check, Search } from 'lucide-react';
import type { CampaignRecipient } from '@shared/types/campaign';
import * as api from '../api/api';
import { RecipientStatusDot } from '../components/badges';
import { priorityLabel } from '../lib/channels';
import { fmtDateTime, fmtTime } from '../lib/format';
import { DARK, RED } from '../lib/brand';

interface RecipientRow {
   name: string;
   dept: string;
   status: string;
   time: string;
}

export default function WebLiveMonitoring() {
   const { id } = useParams<{ id: string }>();
   const [reminderSent, setReminderSent] = useState(false);
   const [search, setSearch] = useState('');
   const [recipients, setRecipients] = useState<RecipientRow[]>([]);
   const [campaignTitle, setCampaignTitle] = useState('Loading…');
   const [campaignMeta, setCampaignMeta] = useState('');

   useEffect(() => {
      if (!id) return;
      api.getCampaign(id)
         .then((c) => {
            setCampaignTitle(c.title);
            setCampaignMeta(
               `${c.sent_at ? `Sent ${fmtDateTime(c.sent_at)}` : c.scheduled_at ? `Scheduled for ${fmtDateTime(c.scheduled_at)}` : 'Not scheduled'} · ${priorityLabel(c.priority)} Priority`,
            );
         })
         .catch(() => setCampaignTitle('Campaign unavailable'));
      api.getRecipients(id)
         .then((data: CampaignRecipient[]) =>
            setRecipients(
               data.map((r) => ({
                  name: r.user_id,
                  dept: '—',
                  status: r.read_at ? 'acknowledged' : r.delivery_status,
                  time: fmtTime(r.delivered_at),
               })),
            ),
         )
         .catch(() => setRecipients([]));
   }, [id]);

   const acked = recipients.filter((r) => r.status === 'acknowledged').length;
   const total = recipients.length;
   const ackRate = total === 0 ? 0 : Math.round((acked / total) * 100);

   const filtered = useMemo(
      () =>
         recipients.filter(
            (r) =>
               r.name.toLowerCase().includes(search.toLowerCase()) ||
               r.dept.toLowerCase().includes(search.toLowerCase()),
         ),
      [recipients, search],
   );

   return (
      <div className="p-5 lg:p-7 space-y-5">
         {/* Header */}
         <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                     <span className="text-xs font-bold text-green-700">LIVE</span>
                  </span>
                  <span className="text-xs text-slate-400">Last updated: just now</span>
               </div>
               <h1 className="text-xl font-bold" style={{ color: DARK }}>
                  {campaignTitle}
               </h1>
               <p className="text-sm text-slate-400 mt-0.5">{campaignMeta}</p>
            </div>
            <button
               onClick={() => {
                  if (!reminderSent) setReminderSent(true);
               }}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${reminderSent ? 'bg-green-50 text-green-700 border border-green-200' : 'text-white'}`}
               style={reminderSent ? {} : { backgroundColor: RED }}
            >
               {reminderSent ? (
                  <>
                     <Check size={14} /> Reminder Sent!
                  </>
               ) : (
                  <>
                     <Bell size={14} /> Send Reminder
                  </>
               )}
            </button>
         </div>

         {/* Ack rate */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                     Acknowledgement Rate
                  </p>
                  <div className="flex items-end gap-2">
                     <span className="text-3xl font-bold" style={{ color: DARK }}>
                        {ackRate}%
                     </span>
                     <span className="text-sm text-green-600 font-bold mb-1">
                        Target: 85%
                     </span>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-xs text-slate-400">
                     {acked.toLocaleString()} / {total.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">acknowledged</p>
               </div>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
               <div
                  className="h-full rounded-full"
                  style={{
                     width: `${ackRate}%`,
                     background: `linear-gradient(to right, ${RED}, #f59e0b, #22c55e)`,
                  }}
               />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
               <span>0%</span>
               <span className="text-green-600 font-bold">Target 85%</span>
               <span>100%</span>
            </div>
         </div>

         {/* Recipient status */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
               <h3 className="font-bold" style={{ color: DARK }}>
                  Recipient Status
               </h3>
               <div className="flex items-center gap-2 bg-[#F4F4F4] rounded-lg px-3 py-1.5">
                  <Search size={12} className="text-slate-400" />
                  <input
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="Search recipients..."
                     className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none w-32"
                  />
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                     <tr className="bg-slate-50">
                        {['Name', 'Department', 'Status', 'Timestamp'].map((h) => (
                           <th
                              key={h}
                              className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wide"
                           >
                              {h}
                           </th>
                        ))}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filtered.map((r) => (
                        <tr key={r.name} className="hover:bg-slate-50 transition-colors">
                           <td
                              className="px-4 py-3 text-sm font-bold"
                              style={{ color: DARK }}
                           >
                              {r.name}
                           </td>
                           <td className="px-4 py-3 text-xs text-slate-400">{r.dept}</td>
                           <td className="px-4 py-3">
                              <RecipientStatusDot s={r.status} />
                           </td>
                           <td className="px-4 py-3 text-xs text-slate-400">{r.time}</td>
                        </tr>
                     ))}
                     {filtered.length === 0 && (
                        <tr>
                           <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-sm text-slate-400"
                           >
                              No recipients found
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
               <p className="text-xs text-slate-400">
                  Showing {filtered.length} of {total.toLocaleString()} recipients
               </p>
            </div>
         </div>
      </div>
   );
}
