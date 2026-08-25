import {
  IonContent,
  IonHeader,
  IonPage,
  IonIcon,
  IonBadge,
  IonButton,
} from "@ionic/react";

import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  notificationsOutline,
  alertCircle,
  chevronForward,
} from "ionicons/icons";

import type { User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";
import {
  registerDevice,
  sendTestNotification,
} from "../services/device.service";
import { signOut } from "../services/auth.service";

import "./Home.css";

const Home: React.FC = () => {
  const history = useHistory();

  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState("Preparing notifications...");
  const [token, setToken] = useState("");

  // --- unchanged: load current user ---
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Failed to load user:", error);
        return;
      }
      setUser(user);
    };
    loadUser();
  }, []);

  // --- unchanged: automatic push notification setup ---
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setStatus("Push notifications are available on the mobile app.");
      return;
    }

    let active = true;

    const setupPushNotifications = async () => {
      await PushNotifications.addListener("registration", async (result) => {
        console.log("FCM token:", result.value);
        if (!active) return;
        setToken(result.value);

        try {
          await registerDevice(result.value);
          if (active) setStatus("Notifications are enabled.");
        } catch (error) {
          console.error("Device registration failed:", error);
          if (active)
            setStatus(
              "Notification token generated, but device registration failed.",
            );
        }
      });

      await PushNotifications.addListener("registrationError", (error) => {
        console.error("FCM registration error:", error);
        if (active) setStatus("Notification registration failed.");
      });

      await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          console.log("Push notification received:", notification);
        },
      );

      await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action) => {
          console.log("Notification opened:", action.notification);
        },
      );

      try {
        let permission = await PushNotifications.checkPermissions();
        console.log("Notification permission:", permission);

        if (permission.receive === "prompt") {
          permission = await PushNotifications.requestPermissions();
        }

        if (permission.receive !== "granted") {
          if (active) setStatus("Notifications are disabled.");
          return;
        }

        if (active) setStatus("Registering device for notifications...");
        await PushNotifications.register();
      } catch (error) {
        console.error("Automatic push setup failed:", error);
        if (active) setStatus("Could not configure notifications.");
      }
    };

    setupPushNotifications();

    return () => {
      active = false;
      PushNotifications.removeAllListeners();
    };
  }, []);

  const testNotification = async () => {
    try {
      setStatus("Sending test notification...");
      await sendTestNotification();
      setStatus("Test notification sent successfully.");
    } catch (error) {
      console.error("Test notification error:", error);
      setStatus("Test notification failed.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Derive a display name from the email prefix, e.g. "nour.ihab@..." -> "Nour"
  const displayName = user?.email
    ? user.email
        .split("@")[0]
        .split(".")[0]
        .replace(/^\w/, (c) => c.toUpperCase())
    : "User";

  return (
    <IonPage>
      <IonHeader className="home-header">
        <div className="home-appbar">
          <div className="home-brand">
            <img
              src="../../public/vodannounce.svg"
              alt="Vodannounce"
              className="home-logo"
            />
            <span className="home-brand-name">Vodannounce</span>
          </div>
          <div
            className="home-bell-wrapper"
            onClick={() => history.push("/notifications")}
          >
            <IonIcon icon={notificationsOutline} className="home-bell" />
            <IonBadge className="home-bell-badge">1</IonBadge>
          </div>
        </div>
        <div className="home-greeting">
          <p className="home-greeting-line">Good afternoon,</p>
          <p className="home-greeting-name">{displayName}</p>
        </div>
      </IonHeader>

      <IonContent className="home-content">
        <div
          className="home-critical-banner"
          onClick={() => history.push("/notifications")}
        >
          <IonIcon icon={alertCircle} className="home-critical-icon" />
          <div className="home-critical-text">
            <p className="home-critical-title">
              Critical Alert Requires Action
            </p>
            <p className="home-critical-subtitle">
              SAP System Maintenance Window
            </p>
          </div>
          <IonIcon icon={chevronForward} className="home-critical-chevron" />
        </div>

        {/* Dev-only push notification debug panel — remove once web sender exists */}
        <div className="home-dev-panel">
          <p className="home-dev-status">{status}</p>
          {token && (
            <IonButton
              expand="block"
              color="success"
              onClick={testNotification}
              size="small"
            >
              Send Test Notification
            </IonButton>
          )}
          <IonButton
            expand="block"
            fill="outline"
            color="medium"
            onClick={handleSignOut}
            size="small"
          >
            Sign Out
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
