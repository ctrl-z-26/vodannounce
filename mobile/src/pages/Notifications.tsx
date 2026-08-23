import { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon } from '@ionic/react';
import { alertCircle, warningOutline, informationCircleOutline } from 'ionicons/icons';
import './Notifications.css';

type Severity = 'critical' | 'important' | 'normal';
type Status = 'unread' | 'acknowledged';

interface Announcement {
  id: string;
  severity: Severity;
  title: string;
  team: string;
  teamInitials: string;
  date: string;
  time: string;
  status: Status;
}

// TODO: replace with real data from the campaigns API
const announcements: Announcement[] = [
  { id: '1', severity: 'critical', title: 'SAP System Maintenance Window', team: 'IT Communications', teamInitials: 'IT', date: 'Today', time: '09:14', status: 'unread' },
  { id: '2', severity: 'important', title: 'Holiday Policy Update 2025', team: 'HR Team', teamInitials: 'HR', date: 'Yesterday', time: '14:30', status: 'acknowledged' },
  { id: '3', severity: 'important', title: 'Security Training Deadline', team: 'Security Team', teamInitials: 'ST', date: '12 Aug', time: '10:00', status: 'acknowledged' },
  { id: '4', severity: 'normal', title: 'Q4 Town Hall Invite', team: 'Communications', teamInitials: 'CM', date: '10 Aug', time: '16:45', status: 'acknowledged' },
];

const severityConfig: Record<Severity, { icon: string; label: string; className: string }> = {
  critical: { icon: alertCircle, label: 'Critical', className: 'badge-critical' },
  important: { icon: warningOutline, label: 'Important', className: 'badge-important' },
  normal: { icon: informationCircleOutline, label: 'Normal', className: 'badge-normal' },
};

type Filter = 'all' | 'unread' | 'acknowledged';

const Notifications: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const unreadCount = announcements.filter((a) => a.status === 'unread').length;
  const filtered = announcements.filter((a) => filter === 'all' || a.status === filter);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" />
          </IonButtons>
          <IonTitle>Notifications</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="notif-content">
        <div className="notif-filters">
          <button className={`notif-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`notif-filter-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>Unread ({unreadCount})</button>
          <button className={`notif-filter-btn ${filter === 'acknowledged' ? 'active' : ''}`} onClick={() => setFilter('acknowledged')}>Acknowledged</button>
        </div>

        <div className="notif-list">
          {filtered.map((a) => {
            const cfg = severityConfig[a.severity];
            return (
              <div key={a.id} className={`notif-card ${a.severity === 'critical' ? 'notif-card-critical' : ''}`}>
                <div className="notif-card-top">
                  <span className={`notif-severity-badge ${cfg.className}`}>
                    <IonIcon icon={cfg.icon} />
                    {cfg.label}
                  </span>
                  <span className="notif-card-date">{a.date} · {a.time}</span>
                </div>
                <p className="notif-card-title">{a.title}</p>
                <div className="notif-card-bottom">
                  <div className="notif-card-sender">
                    <span className="notif-avatar">{a.teamInitials}</span>
                    <span className="notif-team">{a.team}</span>
                  </div>
                  <span className={`notif-status-badge ${a.status}`}>
                    {a.status === 'unread' ? 'Unread' : 'Acknowledged'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;