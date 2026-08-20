import { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';

import {
  IonApp,
  IonLoading,
  IonRouterOutlet,
  setupIonicReact,
} from '@ionic/react';

import { IonReactRouter } from '@ionic/react-router';

import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

import type { Session } from '@supabase/supabase-js';

import Login from './pages/Login';
import Home from './pages/Home';

import { supabase } from './lib/supabase';

/* Core CSS required for Ionic components */
import '@ionic/react/css/core.css';

/* Basic CSS for Ionic apps */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utilities */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Dark mode */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  /*
   * ----------------------------------------
   * SUPABASE AUTH SESSION
   * ----------------------------------------
   */
  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Failed to load session:', error);
      }

      setSession(session);
      setAuthLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /*
   * ----------------------------------------
   * GOOGLE OAUTH DEEP LINK
   * ----------------------------------------
   */
  useEffect(() => {
    const handleOAuthCallback = async (url: string) => {
      if (
        !url.startsWith(
          'com.vois.vodannounce://login-callback'
        )
      ) {
        return;
      }

      try {
        console.log('OAuth callback received:', url);

        const parsedUrl = new URL(url);

        const hashParams = new URLSearchParams(
          parsedUrl.hash.substring(1)
        );

        const accessToken =
          hashParams.get('access_token');

        const refreshToken =
          hashParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          console.error(
            'Access token or refresh token missing'
          );

          return;
        }

        const { error } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

        if (error) {
          console.error(
            'Could not create Supabase session:',
            error
          );

          return;
        }

        console.log(
          'Google authentication successful'
        );

        await Browser.close();
      } catch (error) {
        console.error(
          'OAuth callback error:',
          error
        );
      }
    };

    let listener: any;

    const setupDeepLinks = async () => {
      listener =
        await CapacitorApp.addListener(
          'appUrlOpen',
          ({ url }) => {
            handleOAuthCallback(url);
          }
        );

      const launchUrl =
        await CapacitorApp.getLaunchUrl();

      if (launchUrl?.url) {
        await handleOAuthCallback(
          launchUrl.url
        );
      }
    };

    setupDeepLinks();

    return () => {
      listener?.remove();
    };
  }, []);

  /*
   * ----------------------------------------
   * WAIT WHILE CHECKING AUTH
   * ----------------------------------------
   */
  if (authLoading) {
    return (
      <IonApp>
        <IonLoading
          isOpen={true}
          message="Loading..."
        />
      </IonApp>
    );
  }

  /*
   * ----------------------------------------
   * ROUTES
   * ----------------------------------------
   */
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>

          {/* Login page */}
          <Route exact path="/login">
            {session ? (
              <Redirect to="/home" />
            ) : (
              <Login />
            )}
          </Route>

          {/* Protected Home page */}
          <Route exact path="/home">
            {session ? (
              <Home />
            ) : (
              <Redirect to="/login" />
            )}
          </Route>

          {/* Initial app route */}
          <Route exact path="/">
            <Redirect
              to={
                session
                  ? '/home'
                  : '/login'
              }
            />
          </Route>

        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;