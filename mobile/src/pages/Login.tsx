import { useState } from 'react';

import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
} from '@ionic/react';

import { logoGoogle } from 'ionicons/icons';

import { signInWithGoogle } from '../services/auth.service';

import './Login.css';


const Login: React.FC = () => {

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');


  /*
   * ----------------------------------------
   * GOOGLE SIGN IN
   * ----------------------------------------
   */

  const handleGoogleSignIn = async () => {

    try {

      setLoading(true);

      setErrorMessage('');


      await signInWithGoogle();


      /*
       * No navigation is required here.
       *
       * Flow:
       *
       * Google
       *   ↓
       * Supabase
       *   ↓
       * App.tsx receives the deep link
       *   ↓
       * Supabase session is created
       *   ↓
       * App.tsx detects the session
       *   ↓
       * /login redirects to /home
       */

    } catch (error) {

      console.error(
        'Google sign-in error:',
        error
      );


      setErrorMessage(
        'Unable to sign in with Google. Please try again.'
      );


      setLoading(false);

    }

  };


  /*
   * ----------------------------------------
   * UI
   * ----------------------------------------
   */

  return (

    <IonPage>

      <IonContent
        className="login-content"
        fullscreen
      >

        <div className="login-container">


          {/* --------------------------------
              BRAND
          -------------------------------- */}

          <div className="login-brand">

            <div className="login-logo">

              <div
                className="login-logo-ring"
              />

            </div>


            <h1 className="login-title">
              Vodannounce
            </h1>


            <p className="login-subtitle">
              VOIS EMPLOYEE PORTAL
            </p>

          </div>


          {/* --------------------------------
              LOGIN CARD
          -------------------------------- */}

          <div className="login-card">

            <div className="login-sso">

              <p className="login-sso-hint">
                Use your corporate account
                to sign in securely.
              </p>


              {/*
                FUTURE:
                Microsoft SSO can be added here.

                <IonButton
                  expand="block"
                  fill="outline"
                  shape="round"
                  className="login-sso-btn"
                >
                  <IonIcon
                    icon={logoMicrosoft}
                    slot="start"
                  />

                  Continue with Microsoft

                </IonButton>
              */}


              <IonButton
                expand="block"
                fill="outline"
                shape="round"
                className="login-sso-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >

                {loading ? (

                  <IonSpinner
                    name="crescent"
                  />

                ) : (

                  <>
                    <IonIcon
                      icon={logoGoogle}
                      slot="start"
                    />

                    Continue with Google
                  </>

                )}

              </IonButton>


              {/* Login error */}

              {errorMessage && (

                <p
                  className="login-error"
                >
                  {errorMessage}
                </p>

              )}

            </div>

          </div>


          {/* --------------------------------
              FOOTER
          -------------------------------- */}

          <p className="login-footer">

            By signing in you agree to VOIS{' '}

            <a href="#">
              Terms of Service
            </a>

            {' '}and{' '}

            <a href="#">
              Privacy Policy
            </a>.

          </p>


        </div>

      </IonContent>

    </IonPage>

  );

};


export default Login;