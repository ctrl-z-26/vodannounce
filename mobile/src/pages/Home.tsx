import {
  IonContent,
  IonHeader,
  IonPage,
  IonIcon,
  IonButton,
} from "@ionic/react";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  logOutOutline,
  alertCircle,
  warningOutline,
  informationCircleOutline,
} from "ionicons/icons";

import type { User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";
import { registerDevice } from "../services/device.service";
import { signOut } from "../services/auth.service";
import {
  fetchNotifications,
  markAsRead,
  type Notification,
} from "../services/announcement.service";

import "./Home.css";

type Filter = "all" | "unread" | "read";

const priorityConfig: Record<
  string,
  { icon: string; label: string; className: string }
> = {
  critical: {
    icon: alertCircle,
    label: "Critical",
    className: "badge-critical",
  },
  important: {
    icon: warningOutline,
    label: "Important",
    className: "badge-important",
  },
  normal: {
    icon: informationCircleOutline,
    label: "Normal",
    className: "badge-normal",
  },
};

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  // Load current user
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

  // Fetch notifications
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchNotifications();
        setNotifications(data);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Push notification setup (kept for FCM registration)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let active = true;

    const setupPush = async () => {
      await PushNotifications.addListener("registration", async (result) => {
        if (!active) return;
        try {
          await registerDevice(result.value);
        } catch (err) {
          console.error("Device registration failed:", err);
        }
      });

      await PushNotifications.addListener("registrationError", (error) => {
        console.error("FCM registration error:", error);
      });

      await PushNotifications.addListener(
        "pushNotificationReceived",
        () => {},
      );

      await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        () => {},
      );

      try {
        let permission = await PushNotifications.checkPermissions();
        if (permission.receive === "prompt") {
          permission = await PushNotifications.requestPermissions();
        }
        if (permission.receive === "granted") {
          await PushNotifications.register();
        }
      } catch (err) {
        console.error("Push setup failed:", err);
      }
    };

    setupPush();

    return () => {
      active = false;
      PushNotifications.removeAllListeners();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.readAt;
    if (filter === "read") return !!n.readAt;
    return true;
  });

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.readAt) return;

    // Update locally first
    setNotifications((prev) =>
      prev.map((n) =>
        n.recipientId === notification.recipientId
          ? { ...n, readAt: new Date().toISOString() }
          : n,
      ),
    );

    // Persist to database
    try {
      await markAsRead(notification.recipientId);
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Derive a display name: prefer Google OAuth full_name, fall back to email prefix
  const displayName =
    user?.user_metadata?.full_name ||
    (user?.email
      ? user.email
          .split("@")[0]
          .split(".")[0]
          .replace(/^\w/, (c) => c.toUpperCase())
      : "User");

  return (
    <IonPage>
      <IonHeader className="home-header gradient-animated">
        <div className="home-appbar">
          <div className="home-brand">
            <img
              src="/vodannounce.svg"
              alt="Vodannounce"
              className="home-logo"
            />
            <span className="home-brand-name">Vodannounce</span>
          </div>
          <IonButton
            fill="clear"
            className="home-signout-btn"
            onClick={handleSignOut}
          >
            <IonIcon icon={logOutOutline} slot="icon-only" />
          </IonButton>
        </div>
        <div className="home-greeting">
          <p className="home-greeting-line">Good afternoon,</p>
          <p className="home-greeting-name">{displayName}</p>
        </div>
      </IonHeader>

      <IonContent className="home-content">
        <div className="notif-filters">
          <button
            className={`notif-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`notif-filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`notif-filter-btn ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
          >
            Read
          </button>
        </div>

        {loading ? (
          <div className="home-empty">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="home-empty">No notifications</div>
        ) : (
          <div className="notif-list">
            {filtered.map((n) => {
              const cfg = priorityConfig[n.priority] || priorityConfig.normal;
              const isUnread = !n.readAt;
              const date = n.createdAt
                ? new Date(n.createdAt)
                : null;
              const dateStr = date
                ? date.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })
                : "";
              const timeStr = date
                ? date.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <div
                  key={n.recipientId}
                  className={`notif-card ${n.priority === "critical" ? "notif-card-critical" : ""}`}
                  onClick={() => handleMarkAsRead(n)}
                >
                  <div className="notif-card-top">
                    <span className={`notif-severity-badge ${cfg.className}`}>
                      <IonIcon icon={cfg.icon} />
                      {cfg.label}
                    </span>
                    <span className="notif-card-date">
                      {dateStr} · {timeStr}
                    </span>
                  </div>
                  <p className="notif-card-title">
                    {n.notificationText || n.title}
                  </p>
                  <div className="notif-card-bottom">
                    <span className={`notif-status-badge ${isUnread ? "unread" : "read"}`}>
                      {isUnread ? "Unread" : "Read"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
