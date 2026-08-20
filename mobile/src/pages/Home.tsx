import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import type { User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

import {
  registerDevice,
  sendTestNotification,
} from '../services/device.service';

import { signOut } from '../services/auth.service';


const Home: React.FC = () => {

  /*
   * ----------------------------------------
   * STATE
   * ----------------------------------------
   */

  const [user, setUser] =
    useState<User | null>(null);

  const [status, setStatus] =
    useState('Preparing notifications...');

  const [token, setToken] =
    useState('');


  /*
   * ----------------------------------------
   * LOAD CURRENT LOGGED-IN USER
   * ----------------------------------------
   */

  useEffect(() => {

    const loadUser = async () => {

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();


      if (error) {

        console.error(
          'Failed to load user:',
          error
        );

        return;
      }


      setUser(user);

    };


    loadUser();

  }, []);


  /*
   * ----------------------------------------
   * AUTOMATIC PUSH NOTIFICATION SETUP
   * ----------------------------------------
   *
   * Runs automatically when Home loads.
   *
   * First login:
   * Home
   *  ↓
   * Android permission popup
   *  ↓
   * User presses Allow
   *  ↓
   * FCM registration
   *  ↓
   * FCM token
   *  ↓
   * Backend
   *  ↓
   * Supabase device_tokens
   *
   * Future logins:
   * permission is already granted,
   * so no popup appears.
   * FCM registration happens silently.
   */

  useEffect(() => {

    if (!Capacitor.isNativePlatform()) {

      setStatus(
        'Push notifications are available on the mobile app.'
      );

      return;
    }


    let active = true;


    const setupPushNotifications =
      async () => {

        /*
         * --------------------------------
         * FCM REGISTRATION SUCCESS
         * --------------------------------
         */

        await PushNotifications.addListener(
          'registration',
          async (result) => {

            console.log(
              'FCM token:',
              result.value
            );


            if (!active) {
              return;
            }


            setToken(
              result.value
            );


            try {

              /*
               * Save token against the
               * authenticated Supabase user
               * through our Express backend.
               */

              await registerDevice(
                result.value
              );


              if (active) {

                setStatus(
                  'Notifications are enabled.'
                );

              }

            } catch (error) {

              console.error(
                'Device registration failed:',
                error
              );


              if (active) {

                setStatus(
                  'Notification token generated, but device registration failed.'
                );

              }

            }

          }
        );


        /*
         * --------------------------------
         * FCM REGISTRATION ERROR
         * --------------------------------
         */

        await PushNotifications.addListener(
          'registrationError',
          (error) => {

            console.error(
              'FCM registration error:',
              error
            );


            if (active) {

              setStatus(
                'Notification registration failed.'
              );

            }

          }
        );


        /*
         * --------------------------------
         * NOTIFICATION RECEIVED
         * WHILE APP IS OPEN
         * --------------------------------
         */

        await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {

            console.log(
              'Push notification received:',
              notification
            );

          }
        );


        /*
         * --------------------------------
         * USER TAPS NOTIFICATION
         * --------------------------------
         */

        await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => {

            console.log(
              'Notification opened:',
              action.notification
            );


            /*
             * Later we will use this to open
             * the correct announcement:
             *
             * const announcementId =
             *   action.notification.data
             *     ?.announcementId;
             *
             * history.push(
             *   `/announcements/${announcementId}`
             * );
             */

          }
        );


        /*
         * --------------------------------
         * CHECK AND REQUEST PERMISSION
         * --------------------------------
         */

        try {

          let permission =
            await PushNotifications
              .checkPermissions();


          console.log(
            'Notification permission:',
            permission
          );


          /*
           * Android has never asked
           * this user before.
           *
           * This triggers the system popup:
           *
           * "Allow VOIS Pulse to send
           * you notifications?"
           */

          if (
            permission.receive === 'prompt'
          ) {

            permission =
              await PushNotifications
                .requestPermissions();

          }


          /*
           * User rejected notification
           * permission.
           */

          if (
            permission.receive !== 'granted'
          ) {

            if (active) {

              setStatus(
                'Notifications are disabled.'
              );

            }

            return;

          }


          /*
           * Permission is granted.
           *
           * On first login:
           * user has just pressed Allow.
           *
           * On future logins:
           * Android already remembered Allow.
           */

          if (active) {

            setStatus(
              'Registering device for notifications...'
            );

          }


          /*
           * Ask FCM for the registration token.
           *
           * When successful, this triggers
           * the "registration" listener above.
           */

          await PushNotifications.register();


        } catch (error) {

          console.error(
            'Automatic push setup failed:',
            error
          );


          if (active) {

            setStatus(
              'Could not configure notifications.'
            );

          }

        }

      };


    setupPushNotifications();


    /*
     * Cleanup when Home is removed.
     */

    return () => {

      active = false;

      PushNotifications
        .removeAllListeners();

    };

  }, []);


  /*
   * ----------------------------------------
   * TEMPORARY TEST NOTIFICATION
   * ----------------------------------------
   *
   * This is only for development.
   *
   * Later the sender Web App will trigger
   * notifications instead.
   */

  const testNotification = async () => {

    try {

      setStatus(
        'Sending test notification...'
      );


      await sendTestNotification();


      setStatus(
        'Test notification sent successfully.'
      );


    } catch (error) {

      console.error(
        'Test notification error:',
        error
      );


      setStatus(
        'Test notification failed.'
      );

    }

  };


  /*
   * ----------------------------------------
   * SIGN OUT
   * ----------------------------------------
   */

  const handleSignOut = async () => {

    try {

      await signOut();


      /*
       * App.tsx detects that the Supabase
       * session is now null and redirects:
       *
       * /home
       *   ↓
       * /login
       */

    } catch (error) {

      console.error(
        'Sign out failed:',
        error
      );

    }

  };


  /*
   * ----------------------------------------
   * UI
   * ----------------------------------------
   */

  return (

    <IonPage>

      <IonHeader>

        <IonToolbar>

          <IonTitle>
            VOIS Pulse
          </IonTitle>

        </IonToolbar>

      </IonHeader>


      <IonContent className="ion-padding">


        {/* USER INFORMATION */}

        <h2>
          Welcome
        </h2>


        {user ? (

          <>

            <p>
              Logged in as:
            </p>


            <strong>
              {user.email}
            </strong>

          </>

        ) : (

          <p>
            Loading employee information...
          </p>

        )}


        <br />


        {/* NOTIFICATION STATUS */}

        <h3>
          Notification Status
        </h3>


        <p>
          {status}
        </p>


        {/*
         * TEMPORARY DEVELOPMENT BUTTON.
         *
         * Remove this once the web sender app
         * sends real announcements.
         */}

        {token && (

          <IonButton
            expand="block"
            color="success"
            onClick={testNotification}
          >

            Send Test Notification

          </IonButton>

        )}


        {/*
         * TEMPORARY DEVELOPMENT DISPLAY.
         *
         * Do not show FCM tokens to users
         * in the final application.
         */}

        {token && (

          <>

            <h3>
              FCM Token
            </h3>


            <p
              style={{
                wordBreak: 'break-all',
                fontSize: '12px',
              }}
            >

              {token}

            </p>

          </>

        )}


        <br />


        {/* SIGN OUT */}

        <IonButton
          expand="block"
          fill="outline"
          color="medium"
          onClick={handleSignOut}
        >

          Sign Out

        </IonButton>


      </IonContent>

    </IonPage>

  );

};


export default Home;