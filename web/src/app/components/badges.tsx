/** Color-coded pill for an announcement priority (`critical`/`important`/`normal`). */
export function PriorityBadge({ p }: { p: string }) {
   const conf: Record<string, string> = {
      critical: 'bg-red-50 text-red-700 border-red-200',
      important: 'bg-amber-50 text-amber-700 border-amber-200',
      normal: 'bg-slate-50 text-slate-600 border-slate-200',
   };
   const dot: Record<string, string> = {
      critical: 'bg-red-600',
      important: 'bg-amber-500',
      normal: 'bg-slate-400',
   };
   return (
      <span
         className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${conf[p] || conf.normal}`}
      >
         <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot[p] || dot.normal}`}
         />
         {p.charAt(0).toUpperCase() + p.slice(1)}
      </span>
   );
}

/** Color-coded pill for an announcement lifecycle status. */
export function StatusBadge({ s }: { s: string }) {
   const conf: Record<string, [string, string]> = {
      draft: ['bg-yellow-50 text-yellow-700 border-yellow-200', 'Draft'],
      scheduled: ['bg-blue-50 text-blue-700 border-blue-200', 'Scheduled'],
      sent: ['bg-green-50 text-green-700 border-green-200', 'Sent'],
      cancelled: ['bg-slate-50 text-slate-600 border-slate-200', 'Cancelled'],
      failed: ['bg-red-50 text-red-700 border-red-200', 'Failed'],
   };
   const [cls, label] = conf[s] || conf.cancelled!;
   return (
      <span
         className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
      >
         {label}
      </span>
   );
}

/** Colored pill for a per-recipient delivery/acknowledgement state. */
export function RecipientStatusDot({ s }: { s: string }) {
   const conf: Record<string, string> = {
      acknowledged: 'text-green-700 bg-green-50',
      opened: 'text-blue-700 bg-blue-50',
      delivered: 'text-slate-600 bg-slate-50',
      sent: 'text-indigo-600 bg-indigo-50',
      pending: 'text-slate-500 bg-slate-100',
      failed: 'text-red-700 bg-red-50',
   };
   return (
      <span
         className={`text-xs font-medium px-2 py-0.5 rounded-full ${conf[s] || conf.delivered}`}
      >
         {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
   );
}
