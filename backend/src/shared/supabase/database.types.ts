export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      announcement_attachments: {
        Row: {
          announcement_id: string
          created_at: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_attachments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_logs: {
        Row: {
          action: Database["public"]["Enums"]["announcement_log_action"]
          announcement_id: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["announcement_log_action"]
          announcement_id: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["announcement_log_action"]
          announcement_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_logs_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_recipients: {
        Row: {
          announcement_id: string
          created_at: string
          delivered_at: string | null
          delivery_status: Database["public"]["Enums"]["delivery_status"]
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_recipients_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          template_type: Database["public"]["Enums"]["announcement_template_type"]
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          template_type?: Database["public"]["Enums"]["announcement_template_type"]
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          template_type?: Database["public"]["Enums"]["announcement_template_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          channels: Database["public"]["Enums"]["announcement_channel"][]
          created_at: string
          created_by: string | null
          email_body: string | null
          email_subject: string | null
          id: string
          notification_text: string | null
          original_text: string
          priority: Database["public"]["Enums"]["announcement_priority"]
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["announcement_status"]
          targeting: Json
          teams_channel_ids: string[] | null
          teams_message: string | null
          title: string
          updated_at: string
        }
        Insert: {
          channels?: Database["public"]["Enums"]["announcement_channel"][]
          created_at?: string
          created_by?: string | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          notification_text?: string | null
          original_text: string
          priority?: Database["public"]["Enums"]["announcement_priority"]
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          targeting?: Json
          teams_channel_ids?: string[] | null
          teams_message?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          channels?: Database["public"]["Enums"]["announcement_channel"][]
          created_at?: string
          created_by?: string | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          notification_text?: string | null
          original_text?: string
          priority?: Database["public"]["Enums"]["announcement_priority"]
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          targeting?: Json
          teams_channel_ids?: string[] | null
          teams_message?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_logs: {
        Row: {
          announcement_id: string
          attempted_at: string
          channel: Database["public"]["Enums"]["announcement_channel"]
          completed_at: string | null
          destination: string
          error_message: string | null
          id: string
          provider_message_id: string | null
          status: Database["public"]["Enums"]["delivery_status"]
        }
        Insert: {
          announcement_id: string
          attempted_at?: string
          channel: Database["public"]["Enums"]["announcement_channel"]
          completed_at?: string | null
          destination: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
        }
        Update: {
          announcement_id?: string
          attempted_at?: string
          channel?: Database["public"]["Enums"]["announcement_channel"]
          completed_at?: string | null
          destination?: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
        }
        Relationships: [
          {
            foreignKeyName: "delivery_logs_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: Database["public"]["Enums"]["device_platform"]
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: Database["public"]["Enums"]["device_platform"]
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["device_platform"]
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_locations: {
        Row: {
          group_id: string
          location_id: string
        }
        Insert: {
          group_id: string
          location_id: string
        }
        Update: {
          group_id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_locations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          is_lead: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          is_lead?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          is_lead?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      announcement_id_from_storage_path: {
        Args: { object_name: string }
        Returns: string
      }
      can_manage_announcement: {
        Args: { p_announcement_id: string }
        Returns: boolean
      }
      can_view_announcement: {
        Args: { p_announcement_id: string }
        Returns: boolean
      }
      can_view_announcement_audit: {
        Args: { p_announcement_id: string }
        Returns: boolean
      }
      current_profile_role: {
        Args: never
        Returns: Database["public"]["Enums"]["profile_role"]
      }
      get_announcement_statistics: {
        Args: { p_announcement_id: string }
        Returns: {
          delivered_count: number
          failed_count: number
          pending_count: number
          read_count: number
          sent_count: number
          total_recipients: number
        }[]
      }
      get_user_announcements: {
        Args: never
        Returns: {
          announcement_id: string
          created_at: string
          delivered_at: string
          email_body: string
          email_subject: string
          notification_text: string
          original_text: string
          priority: Database["public"]["Enums"]["announcement_priority"]
          read_at: string
          recipient_delivery_status: Database["public"]["Enums"]["delivery_status"]
          scheduled_at: string
          sent_at: string
          status: Database["public"]["Enums"]["announcement_status"]
          title: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_sender_or_admin: { Args: never; Returns: boolean }
      mark_announcement_as_read: {
        Args: { p_announcement_id: string }
        Returns: {
          announcement_id: string
          created_at: string
          delivered_at: string | null
          delivery_status: Database["public"]["Enums"]["delivery_status"]
          id: string
          read_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "announcement_recipients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_audience: { Args: { targeting: Json }; Returns: string[] }
    }
    Enums: {
      announcement_channel: "email" | "teams" | "mobile_push"
      announcement_log_action:
        | "created"
        | "edited"
        | "approved"
        | "scheduled"
        | "sent"
        | "cancelled"
      announcement_priority: "normal" | "important" | "critical"
      announcement_status: "draft" | "scheduled" | "sent" | "cancelled"
      announcement_template_type: "general" | "HR" | "meeting" | "emergency"
      delivery_status: "pending" | "sent" | "delivered" | "failed"
      device_platform: "ios" | "android"
      profile_role: "admin" | "sender" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      announcement_channel: ["email", "teams", "mobile_push"],
      announcement_log_action: [
        "created",
        "edited",
        "approved",
        "scheduled",
        "sent",
        "cancelled",
      ],
      announcement_priority: ["normal", "important", "critical"],
      announcement_status: ["draft", "scheduled", "sent", "cancelled"],
      announcement_template_type: ["general", "HR", "meeting", "emergency"],
      delivery_status: ["pending", "sent", "delivered", "failed"],
      device_platform: ["ios", "android"],
      profile_role: ["admin", "sender", "employee"],
    },
  },
} as const
