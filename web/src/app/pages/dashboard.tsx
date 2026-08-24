import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
   Activity,
   CheckCircle,
   Clock,
   Plus,
   XCircle,
} from 'lucide-react';

import type { Campaign } from '@shared/types/campaign';

import * as api from '../api/api';

import {
   PriorityBadge,
   StatusBadge,
} from '../components/badges';



import { useUser } from '../lib/use-user';
import { fmtDate } from '../lib/format';
import { DARK, RED } from '../lib/brand';


export default function WebDashboard() {

   const navigate = useNavigate();

   const { firstName } = useUser();

   const [campaigns, setCampaigns] =
      useState<Campaign[]>([]);


   /*
    * ----------------------------------------
    * LOAD CAMPAIGNS
    * ----------------------------------------
    */

   useEffect(() => {

      api.getCampaigns()
         .then(setCampaigns)
         .catch(() => setCampaigns([]));

   }, []);


   /*
    * ----------------------------------------
    * KPI COUNTS
    * ----------------------------------------
    */

   const scheduled =
      campaigns.filter(
         (c) => c.status === 'scheduled',
      ).length;


   const drafts =
      campaigns.filter(
         (c) => c.status === 'draft',
      ).length;


   const sent =
      campaigns.filter(
         (c) => c.status === 'sent',
      ).length;


   const cancelled =
      campaigns.filter(
         (c) => c.status === 'cancelled',
      ).length;


   const kpis = [
      {
         label: 'Active Campaigns',
         value: String(scheduled),
         sub: 'Scheduled for delivery',
         icon: Activity,
         color: 'text-blue-600',
         bg: 'bg-blue-50',
      },
      {
         label: 'Pending Approval',
         value: String(drafts),
         sub: 'Awaiting approval',
         icon: Clock,
         color: 'text-amber-600',
         bg: 'bg-amber-50',
      },
      {
         label: 'Completed',
         value: String(sent),
         sub: 'Delivered campaigns',
         icon: CheckCircle,
         color: 'text-green-600',
         bg: 'bg-green-50',
      },
      {
         label: 'Cancelled',
         value: String(cancelled),
         sub: 'Withdrawn campaigns',
         icon: XCircle,
         color: 'text-slate-600',
         bg: 'bg-slate-100',
      },
   ];


   /*
    * ----------------------------------------
    * UI
    * ----------------------------------------
    */

   return (

      <div className="p-5 lg:p-7 space-y-6">


         {/* --------------------------------
             HEADER
         -------------------------------- */}

         <div className="flex items-center justify-between flex-wrap gap-3">

            <div>

               <h1
                  className="text-xl font-bold"
                  style={{ color: DARK }}
               >
                  Good morning, {firstName}
               </h1>


               <p className="text-sm text-slate-400 mt-0.5">

                  {new Date().toLocaleDateString(
                     'en-GB',
                     {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                     },
                  )}

               </p>

            </div>


            <button
               onClick={() =>
                  navigate('/campaign/new')
               }
               className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm"
            >
               <Plus size={16} />

               New Campaign
            </button>

         </div>


         {/* --------------------------------
             KPIs
         -------------------------------- */}

         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {kpis.map(
               ({
                  label,
                  value,
                  sub,
                  icon: Icon,
                  color,
                  bg,
               }) => (

                  <div
                     key={label}
                     className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
                  >

                     <div className="flex items-start justify-between mb-3">

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                           {label}
                        </p>


                        <div
                           className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}
                        >
                           <Icon
                              size={15}
                              className={color}
                           />
                        </div>

                     </div>


                     <p
                        className="text-2xl font-bold"
                        style={{ color: DARK }}
                     >
                        {value}
                     </p>


                     <p className="text-xs text-slate-400 mt-1">
                        {sub}
                     </p>

                  </div>

               ),
            )}

         </div>


         {/* --------------------------------
             MAIN DASHBOARD GRID
         -------------------------------- */}

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">


            {/* ================================
                LEFT COLUMN
                CAMPAIGNS
            ================================= */}

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

               <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">

                  <h2
                     className="font-bold"
                     style={{ color: DARK }}
                  >
                     Active Campaigns
                  </h2>


                  <button
                     onClick={() =>
                        navigate('/history')
                     }
                     className="text-xs font-bold hover:underline"
                     style={{ color: RED }}
                  >
                     View all
                  </button>

               </div>


               <div className="overflow-x-auto">

                  <table className="w-full">

                     <thead>

                        <tr className="bg-slate-50">

                           {[
                              'Campaign',
                              'Priority',
                              'Date',
                              'Status',
                           ].map((h) => (

                              <th
                                 key={h}
                                 className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                              >
                                 {h}
                              </th>

                           ))}

                        </tr>

                     </thead>


                     <tbody className="divide-y divide-slate-100">

                        {campaigns
                           .slice(0, 4)
                           .map((c) => (

                              <tr
                                 key={c.id}
                                 className="hover:bg-slate-50 cursor-pointer transition-colors"
                                 onClick={() =>
                                    navigate(
                                       c.status === 'sent' ||
                                          c.status === 'scheduled'
                                          ? `/campaign/${c.id}/monitor`
                                          : `/history/${c.id}`,
                                    )
                                 }
                              >

                                 <td
                                    className="px-4 py-3 text-sm font-semibold max-w-[200px] truncate"
                                    style={{
                                       color: DARK,
                                    }}
                                 >
                                    {c.title}
                                 </td>


                                 <td className="px-4 py-3">

                                    <PriorityBadge
                                       p={c.priority}
                                    />

                                 </td>


                                 <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">

                                    {fmtDate(
                                       c.created_at,
                                    )}

                                 </td>


                                 <td className="px-4 py-3">

                                    <StatusBadge
                                       s={c.status}
                                    />

                                 </td>

                              </tr>

                           ))}


                        {campaigns.length === 0 && (

                           <tr>

                              <td
                                 colSpan={4}
                                 className="px-4 py-8 text-center text-sm text-slate-400"
                              >
                                 No campaigns yet
                              </td>

                           </tr>

                        )}

                     </tbody>

                  </table>

               </div>

            </div>


            {/* ================================
                RIGHT COLUMN
            ================================= */}

            <div className="space-y-4">


               {/* --------------------------------
                   PENDING APPROVALS
               -------------------------------- */}

               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">

                     <h2
                        className="font-bold"
                        style={{ color: DARK }}
                     >
                        Pending Approvals
                     </h2>


                     <span
                        className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
                        style={{
                           backgroundColor: RED,
                        }}
                     >
                        {drafts}
                     </span>

                  </div>


                  <div className="divide-y divide-slate-100">

                     {campaigns
                        .filter(
                           (c) =>
                              c.status === 'draft',
                        )
                        .slice(0, 5)
                        .map((c) => (

                           <div
                              key={c.id}
                              className="px-5 py-4 hover:bg-slate-50 transition-colors"
                           >

                              <div className="flex items-start justify-between gap-2 mb-2">

                                 <p
                                    className="text-sm font-bold leading-tight"
                                    style={{
                                       color: DARK,
                                    }}
                                 >
                                    {c.title}
                                 </p>


                                 <PriorityBadge
                                    p={c.priority}
                                 />

                              </div>


                              <div className="flex items-center justify-between">

                                 <span className="text-xs text-slate-400">

                                    Created{' '}

                                    {fmtDate(
                                       c.created_at,
                                    )}

                                 </span>


                                 <button
                                    onClick={() =>
                                       navigate(
                                          `/campaign/${c.id}/approve`,
                                       )
                                    }
                                    className="text-xs font-bold hover:underline"
                                    style={{
                                       color: RED,
                                    }}
                                 >
                                    Review →
                                 </button>

                              </div>

                           </div>

                        ))}


                     {drafts === 0 && (

                        <div className="px-5 py-8 text-center">

                           <p className="text-sm text-slate-400">
                              No campaigns awaiting approval
                           </p>

                        </div>

                     )}

                  </div>

               </div>

            </div>

         </div>

      </div>

   );

}