import { Navigate, Outlet } from 'react-router';
import * as api from '../api/api';
import { WebLayout } from '../components/web-layout';
import { useUser } from '../lib/use-user';
import { BG } from '../lib/brand';

/**
 * Route guard + application chrome for all authenticated screens.
 * Redirects to /login when no Supabase session exists; renders nothing
 * until the initial session lookup resolves.
 */
export function AppShell() {
   const { ready, email, fullName, initials } = useUser();

   if (!ready) return null;
   if (!email) return <Navigate to="/login" replace />;

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
