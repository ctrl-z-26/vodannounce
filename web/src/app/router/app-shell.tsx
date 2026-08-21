import { Navigate, Outlet } from 'react-router';
import * as api from '../api/api';
import { WebLayout } from '../components/web-layout';
import { useUser } from '../lib/use-user';
import { BG } from '../lib/brand';

const WEB_ALLOWED_ROLES = ['admin', 'sender'] as const;

/**
 * Route guard + application chrome for all authenticated screens.
 * Redirects to /login when no Supabase session exists or the user's role is
 * not permitted for the web portal. Renders nothing until the initial session
 * lookup resolves.
 */
export function AppShell() {
   const { ready, email, role, fullName, initials } = useUser();

   if (!ready) return null;
   if (!email) return <Navigate to="/login" replace />;

   // Role loaded but not in the allowed set — sign out and bounce to login
   if (role !== null && !WEB_ALLOWED_ROLES.includes(role as typeof WEB_ALLOWED_ROLES[number])) {
      void api.logout();
      return <Navigate to="/login?error=unauthorized" replace />;
   }

   // Role still loading (authenticated but profile query pending)
   if (role === null) return null;

   return (
      <div className="h-screen overflow-hidden" style={{ background: BG }}>
         <WebLayout
            userFull={fullName}
            userInitials={initials}
            onLogout={() => {
               void api.logout();
            }}
         >
            <Outlet />
         </WebLayout>
      </div>
   );
}
