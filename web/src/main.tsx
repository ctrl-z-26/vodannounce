import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { MsalProvider } from '@azure/msal-react';

import App from './app/App.tsx';
import { msalInstance } from './app/auth/microsoft.config.ts';

import './styles/index.css';


async function startApp() {
   await msalInstance.initialize();

   createRoot(
      document.getElementById('root')!,
   ).render(
      <MsalProvider instance={msalInstance}>
         <BrowserRouter>
            <App />
         </BrowserRouter>
      </MsalProvider>,
   );
}


startApp().catch((error) => {
   console.error(
      'Failed to initialize Microsoft authentication:',
      error,
   );
});