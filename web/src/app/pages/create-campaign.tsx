import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, Loader2, Zap } from 'lucide-react';
import * as api from '../api/api';
import { DARK, RED } from '../lib/brand';

export default function WebCreateCampaign() {
   const navigate = useNavigate();
   const [analyzing, setAnalyzing] = useState(false);
   const [error, setError] = useState('');
   const [announcement, setAnnouncement] = useState('');
   const today = new Date().toISOString().slice(0, 10);
   const [date, setDate] = useState(today);
   const [time, setTime] = useState('09:00');

   const handleAnalyze = async () => {
      if (!announcement.trim()) return;
      setError('');
      setAnalyzing(true);
      try {
         const campaign = await api.analyzeCampaign({
            prompt: announcement,
            scheduledAt: date && time ? `${date}T${time}:00` : new Date().toISOString(),
         });
         navigate(`/campaign/${campaign.id}/plan`);
      } catch (e) {
         setError(e instanceof Error ? e.message : 'Analysis failed.');
         setAnalyzing(false);
      }
   };

   return (
      <div className="p-5 lg:p-7">
         {analyzing && (
            <div
               className="fixed inset-0 z-50 flex items-center justify-center"
               style={{ backgroundColor: `${DARK}CC` }}
            >
               <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-xs w-full mx-4">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                     <Loader2 size={28} className="animate-spin" style={{ color: RED }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: DARK }}>
                     Analyzing with AI
                  </h3>
                  <p className="text-sm text-slate-500">
                     Selecting audience, classifying urgency, recommending channels…
                  </p>
                  <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                     <div
                        className="h-full rounded-full animate-pulse"
                        style={{ width: '65%', backgroundColor: RED }}
                     />
                  </div>
               </div>
            </div>
         )}
         <div className="max-w-2xl">
            <div className="mb-7">
               <h1 className="text-xl font-bold" style={{ color: DARK }}>
                  New Announcement
               </h1>
               <p className="text-sm text-slate-400 mt-0.5">
                  Write your message — AI will select the audience, priority, and channels
               </p>
            </div>
            <div className="space-y-4">
               <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <label className="block text-sm font-bold mb-2" style={{ color: DARK }}>
                     Announcement <span style={{ color: RED }}>*</span>
                  </label>
                  <textarea
                     rows={8}
                     value={announcement}
                     onChange={(e) => setAnnouncement(e.target.value)}
                     placeholder="Write your announcement here. Be clear about what's happening, who it affects, and any actions required."
                     className="w-full px-3.5 py-2.5 text-sm bg-[#F4F4F4] border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 resize-none transition-colors leading-relaxed"
                     style={{ color: DARK }}
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                     <Zap size={11} style={{ color: RED }} />
                     <p className="text-xs text-slate-400">
                        AI will classify urgency, select the right audience, and optimise
                        content per channel.
                     </p>
                  </div>
               </div>

               <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <label className="block text-sm font-bold mb-3" style={{ color: DARK }}>
                     Effective Date & Time
                  </label>
                  <div className="flex gap-3">
                     <div className="flex-1">
                        <p className="text-xs text-slate-400 mb-1.5 font-medium">Date</p>
                        <input
                           type="date"
                           value={date}
                           onChange={(e) => setDate(e.target.value)}
                           className="w-full px-3 py-2.5 text-sm bg-[#F4F4F4] border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 transition-colors"
                           style={{ color: DARK }}
                        />
                     </div>
                     <div className="w-32">
                        <p className="text-xs text-slate-400 mb-1.5 font-medium">Time</p>
                        <input
                           type="time"
                           value={time}
                           onChange={(e) => setTime(e.target.value)}
                           className="w-full px-3 py-2.5 text-sm bg-[#F4F4F4] border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 transition-colors"
                           style={{ color: DARK }}
                        />
                     </div>
                  </div>
               </div>

               {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                     <AlertTriangle
                        size={13}
                        style={{ color: RED }}
                        className="flex-shrink-0"
                     />
                     <p className="text-xs text-red-700 font-semibold">{error}</p>
                  </div>
               )}

               <button
                  onClick={handleAnalyze}
                  disabled={!announcement.trim() || analyzing}
                  className="btn-primary w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-base shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
               >
                  <Zap size={20} /> Analyse with AI
               </button>
            </div>
         </div>
      </div>
   );
}
