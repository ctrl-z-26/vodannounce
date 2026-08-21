import { Route, Routes } from 'react-router';
import { AppShell } from './router/app-shell';
import WebLogin from './pages/login';
import WebDashboard from './pages/dashboard';
import WebCreateCampaign from './pages/create-campaign';
import WebAIPlan from './pages/ai-plan';
import WebContentPreview from './pages/content-preview';
import WebApproval from './pages/approval';
import WebLiveMonitoring from './pages/monitoring';
import WebCampaignHistory from './pages/campaign-history';
import WebCampaignDetail from './pages/campaign-detail';

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
