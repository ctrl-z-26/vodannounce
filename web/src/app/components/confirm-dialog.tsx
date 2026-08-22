import { AlertTriangle } from 'lucide-react';
import { RED } from '../lib/brand';

export function ConfirmDialog({
   open,
   title,
   description,
   confirmLabel,
   onConfirm,
   onCancel,
}: {
   open: boolean;
   title: string;
   description: string;
   confirmLabel: string;
   onConfirm: () => void;
   onCancel: () => void;
}) {
   if (!open) return null;

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
         <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
         <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} style={{ color: RED }} />
               </div>
               <h3 className="text-base font-bold text-slate-800">{title}</h3>
            </div>
            <p className="text-sm text-slate-500 mb-6 ml-12">{description}</p>
            <div className="flex gap-3 justify-end">
               <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
               >
                  Cancel
               </button>
               <button
                  onClick={onConfirm}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors"
                  style={{ backgroundColor: RED }}
               >
                  {confirmLabel}
               </button>
            </div>
         </div>
      </div>
   );
}
