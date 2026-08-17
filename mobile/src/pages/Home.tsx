import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import type { User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

import {
  signInWithGoogle,
  signOut,
} from '../services/auth.service';

import { registerDevice, sendTestNotification, } from '../services/device.service';


const Home: React.FC = () => {

  const [user, setUser] =
    useState<User | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [status, setStatus] =
    useState('Not registered');

  const [token, setToken] =
    useState('');

  const testNotification = async () => {
    try {

      setStatus(
        'Sending test notification...'
      );

      await sendTestNotification();

      setStatus(
        'Test notification sent successfully'
      );

    } catch (error) {

      console.error(
        'Test notification error:',
        error
      );

      setStatus(
        'Test notification failed'
      );

    }
  };
  /*
   * --------------------------------
   * SUPABASE AUTHENTICATION
   * --------------------------------
   */
  useEffect(() => {

    const loadSession = async () => {

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          'Failed to read Supabase session:',
          error
        );
      }

      setUser(session?.user ?? null);

      setAuthLoading(false);
    };


    loadSession();


    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {

        console.log(
          'Auth state changed:',
          _event
        );

        setUser(
          session?.user ?? null
        );

      }
    );


    return () => {
      subscription.unsubscribe();
    };

  }, []);


  /*
   * --------------------------------
   * FCM LISTENERS
   * --------------------------------
   */
  useEffect(() => {

    if (!Capacitor.isNativePlatform()) {
      return;
    }


    const setupListeners = async () => {

      await PushNotifications.addListener(
        'registration',
        async (result) => {

          console.log(
            'FCM token:',
            result.value
          );

          setToken(result.value);


          try {

            await registerDevice(
              result.value
            );


            setStatus(
              'FCM registered and device saved successfully'
            );

          } catch (error) {

            console.error(
              'Device registration failed:',
              error
            );


            if (
              error instanceof Error &&
              error.message.includes(
                'logged in'
              )
            ) {

              setStatus(
                'FCM token received — login required before saving'
              );

            } else {

              setStatus(
                'FCM token received, but backend registration failed'
              );

            }
          }
        }
      );


      await PushNotifications.addListener(
        'registrationError',
        (error) => {

          console.error(
            'FCM registration error:',
            error
          );

          setStatus(
            'FCM registration failed'
          );

        }
      );


      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {

          console.log(
            'Notification received:',
            notification
          );

        }
      );

    };


    setupListeners();


    return () => {
      PushNotifications.removeAllListeners();
    };

  }, []);


  /*
   * --------------------------------
   * ENABLE PUSH NOTIFICATIONS
   * --------------------------------
   */
  const enableNotifications =
    async () => {

      try {

        if (!user) {

          setStatus(
            'Please sign in first'
          );

          return;
        }


        if (!Capacitor.isNativePlatform()) {

          setStatus(
            'Push notifications must be tested on Android'
          );

          return;
        }


        let permission =
          await PushNotifications
            .checkPermissions();


        if (
          permission.receive ===
          'prompt'
        ) {

          permission =
            await PushNotifications
              .requestPermissions();

        }


        if (
          permission.receive !==
          'granted'
        ) {

          setStatus(
            'Notification permission denied'
          );

          return;
        }


        setStatus(
          'Registering with FCM...'
        );


        await PushNotifications.register();


      } catch (error) {

        console.error(error);

        setStatus(
          'Error while registering'
        );

      }

    };


  /*
   * --------------------------------
   * UI
   * --------------------------------
   */

  if (authLoading) {

    return (
      <IonPage>

        <IonContent className="ion-padding">

          <IonSpinner />

          <p>
            Loading...
          </p>

        </IonContent>

      </IonPage>
    );

  }


  return (
    <IonPage>

      <IonHeader>

        <IonToolbar>

          <IonTitle>
            Vodannounce
          </IonTitle>

        </IonToolbar>

      </IonHeader>


      <IonContent className="ion-padding">

        {!user ? (

          <>
            <h2>
              Welcome to Vodannounce
            </h2>

            <p>
              Sign in to receive company
              announcements.
            </p>

            <IonButton
              expand="block"
              onClick={signInWithGoogle}
            >
              Continue with Google
            </IonButton>
          </>

        ) : (

          <>
            <h2>
              Welcome
            </h2>

            <p>
              Logged in as:
            </p>

            <strong>
              {user.email}
            </strong>

            <p>
              User ID:
            </p>

            <small>
              {user.id}
            </small>


            <br />
            <br />


            <IonButton
              expand="block"
              onClick={enableNotifications}
            >
              Enable Notifications
            </IonButton>


            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              onClick={signOut}
            >
              Sign Out
            </IonButton>


            <h3>
              Notification Status
            </h3>

            <p>
              {status}
            </p>
            {token && (
              <IonButton
                expand="block"
                color="success"
                onClick={testNotification}
              >
                Send Test Notification
              </IonButton>
            )}

            {token && (

              <>
                <h3>
                  FCM Token
                </h3>

                <p
                  style={{
                    wordBreak:
                      'break-all',

                    fontSize:
                      '12px',
                  }}
                >
                  {token}
                </p>
              </>

            )}

          </>

        )}

      </IonContent>

    </IonPage>
  );
};


export default Home;