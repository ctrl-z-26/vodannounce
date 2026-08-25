import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

import type { User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

import {
  registerDevice,
  sendTestNotification,
} from '../services/device.service';

import { signOut } from '../services/auth.service';

import './Home.css';

type UserAnnouncement = {
  announcement_id: string;
  title: string;
  original_text: string;
  notification_text: string | null;
  priority: 'normal' | 'important' | 'critical';
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  sent_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  read_at: string | null;
  recipient_delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
};

function notificationAnnouncementId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const value =
    record.campaign_id ??
    record.campaignId ??
    record.announcement_id ??
    record.announcementId;

  return typeof value === 'string' && value.length > 0 ? value : null;
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Just now';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function priorityColor(priority: UserAnnouncement['priority']): string {
  if (priority === 'critical') return 'danger';
  if (priority === 'important') return 'warning';
  return 'medium';
}

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState('Preparing notifications...');
  const [token, setToken] = useState('');
  const [announcements, setAnnouncements] = useState<UserAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState('');
  const [highlightedAnnouncementId, setHighlightedAnnouncementId] = useState('');

  const loadAnnouncements = useCallback(async (focusAnnouncementId?: string | null) => {
    setAnnouncementsLoading(true);
    setAnnouncementsError('');

    const { data, error } = await supabase.rpc('get_user_announcements');

    if (error) {
      console.error('Failed to load announcements:', error);
      setAnnouncementsError('Could not load announcements.');
      setAnnouncements([]);
      setAnnouncementsLoading(false);
      return;
    }

    const rows = ((data ?? []) as UserAnnouncement[]).sort((a, b) => {
      const left = new Date(a.sent_at ?? a.created_at).getTime();
      const right = new Date(b.sent_at ?? b.created_at).getTime();
      return right - left;
    });

    setAnnouncements(rows);
    if (focusAnnouncementId) {
      setHighlightedAnnouncementId(focusAnnouncementId);
    }
    setAnnouncementsLoading(false);
  }, []);

  const markAnnouncementAsRead = useCallback(async (announcementId: string) => {
    const { error } = await supabase.rpc('mark_announcement_as_read', {
      p_announcement_id: announcementId,
    });

    if (error) {
      console.error('Failed to mark announcement as read:', error);
      setAnnouncementsError('Could not mark announcement as read.');
      return;
    }

    const readAt = new Date().toISOString();
    setAnnouncements((items) =>
      items.map((item) =>
        item.announcement_id === announcementId
          ? { ...item, read_at: item.read_at ?? readAt }
          : item,
      ),
    );
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Failed to load user:', error);
        return;
      }

      setUser(user);
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadAnnouncements();
  }, [loadAnnouncements, user]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('Push notifications are available on the mobile app.');
      return;
    }

    let active = true;

    const setupPushNotifications = async () => {
      await PushNotifications.addListener('registration', async (result) => {
        if (!active) return;

        setToken(result.value);

        try {
          await registerDevice(result.value);
          if (active) setStatus('Notifications are enabled.');
        } catch (error) {
          console.error('Device registration failed:', error);
          if (active) {
            setStatus('Notification token generated, but device registration failed.');
          }
        }
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.error('FCM registration error:', error);
        if (active) setStatus('Notification registration failed.');
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        const announcementId = notificationAnnouncementId(notification.data);
        if (active) {
          setStatus('New announcement received.');
          void loadAnnouncements(announcementId);
        }
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const announcementId = notificationAnnouncementId(action.notification.data);
        if (active) {
          setStatus('Announcement opened from notification.');
          void loadAnnouncements(announcementId);
          if (announcementId) void markAnnouncementAsRead(announcementId);
        }
      });

      try {
        let permission = await PushNotifications.checkPermissions();

        if (permission.receive === 'prompt') {
          permission = await PushNotifications.requestPermissions();
        }

        if (permission.receive !== 'granted') {
          if (active) setStatus('Notifications are disabled.');
          return;
        }

        if (active) setStatus('Registering device for notifications...');
        await PushNotifications.register();
      } catch (error) {
        console.error('Automatic push setup failed:', error);
        if (active) setStatus('Could not configure notifications.');
      }
    };

    setupPushNotifications();

    return () => {
      active = false;
      PushNotifications.removeAllListeners();
    };
  }, [loadAnnouncements, markAnnouncementAsRead]);

  const testNotification = async () => {
    try {
      setStatus('Sending test notification...');
      await sendTestNotification();
      setStatus('Test notification sent successfully.');
    } catch (error) {
      console.error('Test notification error:', error);
      setStatus('Test notification failed.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>VOIS Pulse</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding home-content">
        <section className="home-panel employee-panel">
          <h2>Welcome</h2>
          {user ? (
            <>
              <p className="muted-label">Logged in as</p>
              <strong>{user.email}</strong>
            </>
          ) : (
            <p>Loading employee information...</p>
          )}
        </section>

        <section className="home-panel">
          <div className="section-heading-row">
            <h3>Announcements</h3>
            <IonButton
              size="small"
              fill="clear"
              onClick={() => loadAnnouncements()}
              disabled={announcementsLoading}
            >
              Refresh
            </IonButton>
          </div>

          {announcementsLoading && <p className="empty-text">Loading announcements...</p>}
          {announcementsError && <p className="error-text">{announcementsError}</p>}

          {!announcementsLoading && announcements.length === 0 && !announcementsError && (
            <p className="empty-text">No announcements yet.</p>
          )}

          <div className="announcement-list">
            {announcements.map((announcement) => {
              const isHighlighted =
                highlightedAnnouncementId === announcement.announcement_id;
              const message =
                announcement.notification_text ?? announcement.original_text;
              const isRead = Boolean(announcement.read_at);

              return (
                <article
                  key={announcement.announcement_id}
                  className={
                    isHighlighted
                      ? 'announcement-card announcement-card-active'
                      : 'announcement-card'
                  }
                >
                  <div className="announcement-card-topline">
                    <IonBadge color={priorityColor(announcement.priority)}>
                      {announcement.priority.toUpperCase()}
                    </IonBadge>
                    <span className={isRead ? 'read-state' : 'read-state unread'}>
                      {isRead ? 'Read' : 'Unread'}
                    </span>
                  </div>

                  <h4>{announcement.title}</h4>
                  <p>{message}</p>

                  <div className="announcement-meta-row">
                    <span>{formatDateTime(announcement.sent_at ?? announcement.created_at)}</span>
                    <span>{announcement.recipient_delivery_status}</span>
                  </div>

                  {!isRead && (
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={() => markAnnouncementAsRead(announcement.announcement_id)}
                    >
                      Mark as read
                    </IonButton>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="home-panel">
          <h3>Notification Status</h3>
          <p>{status}</p>

          {token && (
            <IonButton expand="block" color="success" onClick={testNotification}>
              Send Test Notification
            </IonButton>
          )}
        </section>

        <IonButton expand="block" fill="outline" color="medium" onClick={handleSignOut}>
          Sign Out
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Home;
