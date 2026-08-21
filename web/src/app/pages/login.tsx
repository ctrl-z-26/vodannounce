import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useAnimate } from 'motion/react';
import * as api from '../api/api';
import { BG, DARK, RED } from '../lib/brand';

const SLOGANS = ['Be Unrivalled', 'Create The Future'];

function Typewriter() {
   const [scope, animate] = useAnimate<HTMLSpanElement>();
   const indexRef = useRef(0);

   useEffect(() => {
      const el = scope.current;
      if (!el) return;
      let cancelled = false;

      async function run() {
         while (!cancelled) {
            const text = SLOGANS[indexRef.current];
            // Type in
            for (let i = 1; i <= text.length; i++) {
               if (cancelled) return;
               el.textContent = text.slice(0, i);
               await animate(el, { opacity: [0, 1] }, { duration: 0.001 });
               await new Promise((r) => setTimeout(r, 80));
            }
            // Pause
            await new Promise((r) => setTimeout(r, 2000));
            // Delete out
            for (let i = text.length; i >= 0; i--) {
               if (cancelled) return;
               el.textContent = text.slice(0, i);
               await new Promise((r) => setTimeout(r, 40));
            }
            indexRef.current = (indexRef.current + 1) % SLOGANS.length;
         }
      }
      run();
      return () => {
         cancelled = true;
      };
   }, [animate, scope]);

   return <span ref={scope} className="text-sm font-bold text-white typewriter-cursor" />;
}

export default function WebLogin() {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   const handleGoogle = async () => {
      setError('');
      setLoading(true);
      try {
         await api.loginWithGoogle();
      } catch (e) {
         setError(e instanceof Error ? e.message : 'Sign-in failed.');
         setLoading(false);
      }
   };

   return (
      <div className="min-h-full flex" style={{ background: BG }}>
         {/* Left panel — brand */}
         <div className="hidden lg:flex flex-col justify-between w-96 flex-shrink-0 p-10 gradient-animated">
            <div className="flex items-center gap-3">
               <img src="/vodannounce.svg" width={32} height={32} alt="Vodannounce" />
               <div>
                  <div className="text-white font-bold text-base leading-tight">
                     Vodannounce
                  </div>
                  <div className="text-white/60 text-[11px]">VOIS Sender Portal</div>
               </div>
            </div>
            <div>
               <h2 className="text-white text-3xl font-bold leading-snug mb-4">
                  Communicate.
                  <br />
                  Inform.
                  <br />
                  <span>Connect.</span>
               </h2>
               <p className="text-white/60 text-sm leading-relaxed">
                  AI-powered corporate communication platform for VOIS. Send announcements
                  across all channels and monitor acknowledgements in real time.
               </p>
            </div>
            <div>
               <Typewriter />
            </div>
         </div>
         <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
               <div className="flex flex-col items-center mb-8 lg:hidden">
                  <img
                     src="/vodannounce.svg"
                     width={48}
                     height={48}
                     alt="Vodannounce"
                     className="filter-red"
                  />
                  <h1 className="text-2xl font-bold mt-3" style={{ color: DARK }}>
                     Vodannounce
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">VOIS Sender Portal</p>
               </div>

               <div className="hidden lg:block mb-8">
                  <h1 className="text-2xl font-bold" style={{ color: DARK }}>
                     Sign in
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                     Use your VOIS account to access the portal
                  </p>
               </div>

               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
                  <p className="text-sm font-bold mb-1" style={{ color: DARK }}>
                     Single Sign-On
                  </p>
                  <p className="text-xs text-slate-400 mb-6">
                     Sign in with your organisation Google account
                  </p>
                  {error && (
                     <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
                        <AlertTriangle
                           size={13}
                           style={{ color: RED }}
                           className="flex-shrink-0"
                        />
                        <p className="text-xs text-red-700 font-semibold">{error}</p>
                     </div>
                  )}
                  <button
                     onClick={handleGoogle}
                     disabled={loading}
                     className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                     ) : (
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                           <path
                              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                              fill="#4285F4"
                           />
                           <path
                              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                              fill="#34A853"
                           />
                           <path
                              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
                              fill="#FBBC05"
                           />
                           <path
                              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
                              fill="#EA4335"
                           />
                        </svg>
                     )}
                     {loading ? 'Redirecting to Google…' : 'Continue with Google'}
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-5">
                     Your organisation may require MFA on first sign-in.
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
}
