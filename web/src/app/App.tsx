import { Navigate, Outlet, Route, Routes } from 'react-router';
import * as api from './api/api';
import { WebLayout } from './components/web-layout';
import { useUser } from './lib/use-user';
import { BG } from './lib/brand';
import WebLogin from './pages/login';
import WebDashboard from './pages/dashboard';
import WebCreateCampaign from './pages/create-campaign';
import WebAIPlan from './pages/ai-plan';
import WebContentPreview from './pages/content-preview';
import WebApproval from './pages/approval';
import WebLiveMonitoring from './pages/monitoring';
import WebCampaignHistory from './pages/campaign-history';
import WebCampaignDetail from './pages/campaign-detail';

const WEB_ALLOWED_ROLES = ['admin', 'sender'] as const;

function AppShell() {
   const { ready, email, role, fullName, initials } = useUser();

   if (!ready) return null;
   if (!email) return <Navigate to="/login" replace />;

   if (role !== null && !WEB_ALLOWED_ROLES.includes(role as typeof WEB_ALLOWED_ROLES[number])) {
      void api.logout();
      return <Navigate to="/login?error=unauthorized" replace />;
   }

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

export default function App() {
   return (
      <Routes>
         <Route path="/login" element={<WebLogin />} />
         <Route element={<AppShell />}>
            <Route path="/" element={<WebDashboard />} />
            <Route path="/campaign/new" element={<WebCreateCampaign />} />
            <Route path="/campaign/:id/plan" element={<WebAIPlan />} />
            <Route path="/campaign/:id/preview" element={<WebContentPreview />} />
            <Route path="/campaign/:id/approve" element={<WebApproval />} />
            <Route path="/campaign/:id/monitor" element={<WebLiveMonitoring />} />
            <Route path="/history" element={<WebCampaignHistory />} />
            <Route path="/history/:id" element={<WebCampaignDetail />} />
         </Route>
      </Routes>
   );
}
