import { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { eyeOutline, eyeOffOutline, logoGoogle, logoMicrosoft } from 'ionicons/icons';
import './Login.css';

type AuthTab = 'password' | 'sso';

const Login: React.FC = () => {
  const [tab, setTab] = useState<AuthTab>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    // TODO: sign in email/password with supabase auth
    console.log('sign in with', email);
  };

  const handleGoogleSignIn = () => {
    // TODO: SSO google
  };

  const handleMicrosoftSignIn = () => {
    // TODO: SSO microsoft
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
            <IonSegment
              value={tab}
              onIonChange={(e) => setTab(e.detail.value as AuthTab)}
              className="login-segment"
            >
              <IonSegmentButton value="password">
                <IonLabel>Email &amp; Password</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="sso">
                <IonLabel>Single Sign-On</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {tab === 'password' ? (
              <div className="login-form">
                <IonLabel className="login-field-label">Work Email</IonLabel>
                <IonInput
                  className="login-input"
                  type="email"
                  placeholder="firstname.lastname@vodafone.com"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value ?? '')}
                />

                <IonLabel className="login-field-label">Password</IonLabel>
                <div className="login-password-wrapper">
                  <IonInput
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="*********"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value ?? '')}
                  />
                  <IonIcon
                    icon={showPassword ? eyeOffOutline : eyeOutline}
                    className="login-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                  />
                </div>

                <IonButton
                  expand="block"
                  shape="round"
                  className="login-signin-btn"
                  onClick={handleSignIn}
                >
                  Sign In
                </IonButton>
              </div>
            ) : (
              <div className="login-sso">
                <p className="login-sso-hint">
                  Use your corporate account to sign in securely.
                </p>
                <IonButton
                  expand="block"
                  fill="outline"
                  shape="round"
                  className="login-sso-btn"
                  onClick={handleMicrosoftSignIn}
                >
                  <IonIcon icon={logoMicrosoft} slot="start" />
                  Continue with Microsoft
                </IonButton>
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
            )}
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