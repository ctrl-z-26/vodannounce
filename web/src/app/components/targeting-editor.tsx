import { X } from 'lucide-react';
import type { Target, TargetingExpression, TargetContext } from '@shared/types/campaign';
import { DARK } from '../lib/brand';

interface TargetingEditorProps {
   value: TargetingExpression;
   onChange: (t: TargetingExpression) => void;
   targetContext: TargetContext;
}

export function TargetingEditor({
   value,
   onChange,
   targetContext,
}: TargetingEditorProps) {
   const addCell = () => onChange([...value, []]);

   const removeCell = (cellIdx: number) =>
      onChange(value.filter((_, i) => i !== cellIdx));

   const addTarget = (cellIdx: number, target: Target) =>
      onChange(value.map((cell, i) => (i === cellIdx ? [...cell, target] : cell)));

   const removeTarget = (cellIdx: number, targetIdx: number) => {
      const next = value.map((cell, i) =>
         i === cellIdx ? cell.filter((_, j) => j !== targetIdx) : cell,
      );
      onChange(next.filter((cell) => cell.length > 0));
   };

   const selectAdd = (cellIdx: number, e: React.ChangeEvent<HTMLSelectElement>) => {
      const [type, ...rest] = e.target.value.split(':');
      const name = rest.join(':');
      if (type && name) {
         addTarget(cellIdx, { type: type as Target['type'], name });
         e.target.value = '';
      }
   };

   const renderOptions = (cellUsedKeys: Set<string>) => (
      <>
         {targetContext.groups.length > 0 && (
            <optgroup label="Groups">
               {targetContext.groups
                  .filter((g) => !cellUsedKeys.has(`group:${g.name}`))
                  .map((g) => (
                     <option key={`group:${g.name}`} value={`group:${g.name}`}>
                        {g.name}
                     </option>
                  ))}
            </optgroup>
         )}
         {targetContext.locations.length > 0 && (
            <optgroup label="Locations">
               {targetContext.locations
                  .filter((n) => !cellUsedKeys.has(`location:${n}`))
                  .map((n) => (
                     <option key={`location:${n}`} value={`location:${n}`}>
                        {n}
                     </option>
                  ))}
            </optgroup>
         )}
      </>
   );

   return (
      <div className="space-y-2">
         {value.map((cell, cellIdx) => {
            const cellUsedKeys = new Set(cell.map((t) => `${t.type}:${t.name}`));
            return (
               <div key={cellIdx}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                     Group {cellIdx + 1}
                  </p>
                  <div
                     className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl border"
                     style={{ borderColor: `${DARK}20`, backgroundColor: `${DARK}04` }}
                  >
                     {cell.map((target, targetIdx) => {
                        const groupMeta =
                           target.type === 'group'
                              ? targetContext.groups.find((g) => g.name === target.name)
                              : undefined;
                        return (
                           <span
                              key={`${target.type}-${target.name}`}
                              title={groupMeta?.description ?? undefined}
                              className="inline-flex items-center gap-1 px-2 py-0.5 border text-xs font-bold rounded-lg"
                              style={{
                                 backgroundColor: `${DARK}08`,
                                 borderColor: `${DARK}20`,
                                 color: DARK,
                              }}
                           >
                              {target.name}
                              <button
                                 type="button"
                                 onClick={() => removeTarget(cellIdx, targetIdx)}
                                 className="text-slate-400 hover:text-red-500 transition-colors"
                              >
                                 <X size={10} />
                              </button>
                           </span>
                        );
                     })}
                     <select
                        value=""
                        onChange={(e) => selectAdd(cellIdx, e)}
                        className="text-xs bg-transparent border border-dashed rounded-lg px-2 py-1 focus:outline-none"
                        style={{ borderColor: `${DARK}30`, color: DARK }}
                     >
                        <option value="">+ Add</option>
                        {renderOptions(cellUsedKeys)}
                     </select>
                     <button
                        type="button"
                        onClick={() => removeCell(cellIdx)}
                        className="ml-auto text-slate-300 hover:text-red-500 transition-colors"
                        title="Remove group"
                     >
                        <X size={13} />
                     </button>
                  </div>
               </div>
            );
         })}

         {value.length === 0 && (
            <p className="text-xs text-slate-400 italic">No audience targets selected</p>
         )}

         <button
            type="button"
            onClick={addCell}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-dashed transition-colors hover:bg-slate-50"
            style={{ borderColor: `${DARK}30`, color: DARK }}
         >
            + Add audience group
         </button>
      </div>
   );
}
