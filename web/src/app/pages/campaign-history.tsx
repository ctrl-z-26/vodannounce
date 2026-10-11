import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Download, Eye, Filter, Search } from 'lucide-react';
import type { Campaign } from '@shared/types/campaign';
import * as api from '../api/api';
import { PriorityBadge, StatusBadge } from '../components/badges';
import { fmtDate } from '../lib/format';
import { DARK, RED } from '../lib/brand';

export default function WebCampaignHistory() {
   const navigate = useNavigate();
   const [search, setSearch] = useState('');
   const [campaigns, setCampaigns] = useState<Campaign[]>([]);

   useEffect(() => {
      api.getCampaigns()
         .then(setCampaigns)
         .catch(() => setCampaigns([]));
   }, []);

   const sent = campaigns.filter((c) => c.status === 'sent').length;
   const scheduled = campaigns.filter((c) => c.status === 'scheduled').length;
   const drafts = campaigns.filter((c) => c.status === 'draft').length;

   const filtered = campaigns.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase()),
   );

   return (
      <div className="p-5 lg:p-7 space-y-5">
         <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-xl font-bold" style={{ color: DARK }}>
               Announcement History
            </h1>
            <div className="flex gap-2">
               <button className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                  <Filter size={14} /> Filter
               </button>
               <button className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                  <Download size={14} /> Export
               </button>
            </div>
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
               { label: 'Total Announcements', value: String(campaigns.length), color: DARK },
               { label: 'Successful', value: String(sent), color: '#16a34a' },
               { label: 'Scheduled', value: String(scheduled), color: '#2563eb' },
               { label: 'Drafts', value: String(drafts), color: RED },
            ].map(({ label, value, color }) => (
               <div
                  key={label}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center"
               >
                  <p className="text-2xl font-bold" style={{ color }}>
                     {value}
                  </p>
                  <p className="text-xs text-slate-400 font-bold mt-1">{label}</p>
               </div>
            ))}
         </div>
         <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <Search size={15} className="text-slate-400" />
            <input
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search announcements by name..."
               className="flex-1 bg-transparent text-sm placeholder-slate-400 outline-none"
               style={{ color: DARK }}
            />
         </div>
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                     <tr className="bg-slate-50">
                        {[
                           'Announcement Name',
                           'Priority',
                           'Created',
                           'Status',
                           'Actions',
                        ].map((h) => (
                           <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                           >
                              {h}
                           </th>
                        ))}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filtered.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                           <td
                              className="px-4 py-3 text-sm font-bold max-w-[220px]"
                              style={{ color: DARK }}
                           >
                              <div className="truncate">{c.title}</div>
                           </td>
                           <td className="px-4 py-3">
                              <PriorityBadge p={c.priority} />
                           </td>
                           <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                              {fmtDate(c.created_at)}
                           </td>
                           <td className="px-4 py-3">
                              <StatusBadge s={c.status} />
                           </td>
                           <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                 <button
                                    onClick={() =>
                                       navigate(
                                          c.status === 'sent' || c.status === 'scheduled'
                                             ? `/campaign/${c.id}/monitor`
                                             : `/history/${c.id}`,
                                       )
                                    }
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                 >
                                    <Eye size={14} />
                                 </button>
                                 <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Download size={14} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {filtered.length === 0 && (
               <div className="py-12 text-center">
                  <p className="text-slate-400 text-sm">
                      No announcements found matching &quot;{search}&quot;
                  </p>
               </div>
            )}
         </div>
      </div>
   );
}
