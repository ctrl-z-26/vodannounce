import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Archive, Home, LogOut, Menu, Plus } from 'lucide-react';
import { BG } from '../lib/brand';

const NAV_ITEMS = [
   { path: '/', label: 'Dashboard', icon: Home },
   { path: '/campaign/new', label: 'Create Campaign', icon: Plus },
   { path: '/history', label: 'Campaign History', icon: Archive },
];

/** Resolves which sidebar item is active for a given pathname. */
function activeNavPath(pathname: string): string | null {
   if (pathname.startsWith('/campaign')) return '/campaign/new';
   if (pathname.startsWith('/history')) return '/history';
   if (pathname === '/') return '/';
   return null;
}

/**
 * Renders children inside the scrollable content area.
 */
export function WebLayout({
   children,
   userFull,
   userInitials,
   onLogout,
}: {
   children: ReactNode;
   userFull: string;
   userInitials: string;
   onLogout: () => void;
}) {
   const navigate = useNavigate();
   const location = useLocation();
   const [sidebar, setSidebar] = useState(false);
   const active = activeNavPath(location.pathname);
   return (
      <div className="flex h-full" style={{ background: BG }}>
         {sidebar && (
            <div
               className="fixed inset-0 bg-black/40 z-30 md:hidden"
               onClick={() => setSidebar(false)}
            />
         )}
         {/* Sidebar */}
         <div
            className={`fixed inset-y-0 left-0 z-40 w-65 flex flex-col transition-transform duration-200 md:relative md:translate-x-0 md:z-auto gradient-animated ${sidebar ? 'translate-x-0' : '-translate-x-full'}`}
         >
            <div className="px-4 pt-5 pb-4 border-b border-white/10">
               <div className="flex items-center gap-2.5">
                  <img src="/vodannounce.svg" width={30} height={30} alt="Vodannounce" />
                  <div>
                     <div className="text-white font-bold text-sm leading-tight">
                        Vodannounce
                     </div>
                     <div className="text-white/40 text-[10px]">VOIS Sender Portal</div>
                  </div>
               </div>
            </div>
            <nav className="sidebar-nav flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
               {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                  <button
                     key={path}
                     onClick={() => {
                        navigate(path);
                        setSidebar(false);
                     }}
                     className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
                     style={
                        active === path
                           ? { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }
                           : { color: 'rgba(255,255,255,0.5)' }
                     }
                  >
                     <Icon size={15} /> {label}
                  </button>
               ))}
            </nav>
            <div className="px-3 py-4 border-t border-white/10">
               <div className="flex items-center gap-3 px-2 mb-3 select-none cursor-default">
                  <div
                     className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                     style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                  >
                     {userInitials}
                  </div>
                  <div className="text-sm font-bold text-white/50 leading-tight">
                     {userFull}
                  </div>
               </div>
               <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all"
               >
                  <LogOut size={15} /> Sign Out
               </button>
            </div>
         </div>
         {/* Main */}
         <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 flex-shrink-0 md:hidden">
               <button
                  className="md:hidden text-slate-500 hover:text-slate-700 transition-colors"
                  onClick={() => setSidebar(true)}
               >
                  <Menu size={20} />
               </button>
            </div>
            <div key={location.pathname} className="flex-1 overflow-y-auto pt-6 px-6 pb-6 pop-in">{children}</div>
         </div>
      </div>
   );
}
