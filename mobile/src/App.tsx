import { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';

import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
} from '@ionic/react';

import { IonReactRouter } from '@ionic/react-router';

import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

import Home from './pages/Home';
import Login from './pages/Login';
import { supabase } from './lib/supabase';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Ionic Dark Mode */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {

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


  return (
    <IonApp>

      <IonReactRouter>

        <IonRouterOutlet>

          <Route exact path="/login">
            <Login />
          </Route>

          <Route exact path="/home">
            <Home />
          </Route>

          <Route exact path="/">
            <Redirect to="/login" />
          </Route>

        </IonRouterOutlet>

      </IonReactRouter>

    </IonApp>
  );
};

export default App;