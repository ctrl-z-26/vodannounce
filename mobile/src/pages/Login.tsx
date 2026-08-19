import { useEffect } from 'react';
import { IonPage, IonContent, IonButton, IonIcon } from '@ionic/react';
import { logoGoogle } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { signInWithGoogle } from '../services/auth.service';
import './Login.css';

const Login: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        history.push('/home');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        history.push('/home');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [history]);

  const handleGoogleSignIn = () => {
    signInWithGoogle().catch((error) => {
      console.error('Google sign-in error:', error);
    });
  };

  return (
    <IonPage>
      <IonContent className="login-content" fullscreen>
        <div className="login-container">
          <div className="login-brand">
            <div className="login-logo">
              <div className="login-logo-ring" />
            </div>
            <h1 className="login-title">Vodannounce</h1>
            <p className="login-subtitle">VOIS EMPLOYEE PORTAL</p>
          </div>

          <div className="login-card">
            <div className="login-sso">
              <p className="login-sso-hint">
                Use your corporate account to sign in securely.
              </p>
              {/*
                TODO(VOIS-27): Microsoft SSO
                <IonButton
                  expand="block"
                  fill="outline"
                  shape="round"
                  className="login-sso-btn"
                >
                  <IonIcon icon={logoMicrosoft} slot="start" />
                  Continue with Microsoft
                </IonButton>
              */}
              <IonButton
                expand="block"
                fill="outline"
                shape="round"
                className="login-sso-btn"
                onClick={handleGoogleSignIn}
              >
                <IonIcon icon={logoGoogle} slot="start" />
                Continue with Google
              </IonButton>
            </div>
          </div>

          <p className="login-footer">
            By signing in you agree to VOIS <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
