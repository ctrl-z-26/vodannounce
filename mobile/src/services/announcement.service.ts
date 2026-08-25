import { supabase } from "../lib/supabase";

export interface Notification {
  recipientId: string;
  announcementId: string;
  title: string;
  notificationText: string | null;
  priority: "normal" | "important" | "critical";
  channels: string[];
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
}

/**
 * Fetch notifications for the current user by joining
 * announcement_recipients with announcements.
 * Only returns delivered notifications that include mobile_push channel.
 */
export async function fetchNotifications(): Promise<Notification[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("announcement_recipients")
    .select(
      `
      id,
      delivered_at,
      read_at,
      created_at,
      announcements (
        id,
        title,
        notification_text,
        priority,
        channels,
        created_at
      )
    `,
    )
    .eq("user_id", user.id)
    .in("delivery_status", ["delivered", "sent"])
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  return data
    .filter((row: any) => {
      const announcement = row.announcements;
      if (!announcement) return false;
      const channels = announcement.channels as string[];
      return channels.includes("mobile_push");
    })
    .map((row: any) => {
      const announcement = row.announcements;
      return {
        recipientId: row.id,
        announcementId: announcement.id,
        title: announcement.title,
        notificationText: announcement.notification_text,
        priority: announcement.priority,
        channels: announcement.channels,
        deliveredAt: row.delivered_at,
        readAt: row.read_at,
        createdAt: row.created_at,
      };
    });
}

/**
 * Mark a notification as read and delivery_status as delivered.
 * Updates the recipient row directly in Supabase.
 */
export async function markAsRead(
  recipientId: string,
): Promise<void> {
  const { error } = await supabase
    .from("announcement_recipients")
    .update({
      read_at: new Date().toISOString(),
      delivery_status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", recipientId);

  if (error) {
    throw error;
  }
}
