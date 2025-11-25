export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Simplified table row types for immediate lint fix
export interface AnnouncementRow {
  id: string;
  title: string;
  content: string | null;
  external_url: string | null;
  deadline: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  slug: string | null;
  organiser_profile_id: string | null;
}

export interface AnnouncementTagRow {
  announcement_id: string;
  tag_id: string;
}

export interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  email_visible: boolean | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  cohort: number | null;
  graduation_year: number | null;
  company: string | null;
  job_title: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  is_public: boolean | null;
  msc: boolean | null;
  user_type: 'Admin' | 'Staff' | 'Alumni' | 'Student';
  is_remote: boolean | null;
  is_entrepreneur: boolean | null;
  is_ise_champion: boolean | null;
  employed: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface TagRow {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  location_url: string | null;
  start_at: string;
  end_at: string | null;
  organiser_profile_id: string | null;
  created_by: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventTagRow {
  event_id: string;
  tag_id: string;
}

export interface ProfileHistoryRow {
  id: string;
  profile_id: string;
  job_title: string | null;
  company: string | null;
  city: string | null;
  country: string | null;
  changed_at: string;
  change_type: 'INSERT' | 'UPDATE';
}

export interface RemindersRow {
  id: string;
  user_id: string;
  target_type: 'event' | 'announcement';
  target_id: string;
  reminder_at: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResidencyPartnerRow {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Legacy Database interface for compatibility
export interface Database {
  public: {
    Tables: {
      announcements: {
        Row: AnnouncementRow;
        Insert: Partial<AnnouncementRow> & Pick<AnnouncementRow, 'title' | 'created_by'>;
        Update: Partial<AnnouncementRow>;
      }
      announcement_tags: {
        Row: AnnouncementTagRow;
        Insert: AnnouncementTagRow;
        Update: Partial<AnnouncementTagRow>;
      }
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, 'user_id'>;
        Update: Partial<ProfileRow>;
      }
      tags: {
        Row: TagRow;
        Insert: Partial<TagRow> & Pick<TagRow, 'name'>;
        Update: Partial<TagRow>;
      }
      events: {
        Row: EventRow;
        Insert: Partial<EventRow> & Pick<EventRow, 'title' | 'start_at' | 'created_by'>;
        Update: Partial<EventRow>;
      }
      event_tags: {
        Row: EventTagRow;
        Insert: EventTagRow;
        Update: Partial<EventTagRow>;
      }
      profiles_history: {
        Row: ProfileHistoryRow;
        Insert: Omit<ProfileHistoryRow, 'id' | 'changed_at'>;
        Update: Partial<ProfileHistoryRow>;
      }
      reminders: {
        Row: {
          id: string;
          user_id: string;
          target_type: 'event' | 'announcement';
          target_id: string;
          reminder_at: string;
          status: 'pending' | 'sent' | 'failed' | 'cancelled';
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          target_type: 'event' | 'announcement';
          target_id: string;
          reminder_at: string;
          status: 'pending' | 'sent' | 'failed' | 'cancelled';
        };
        Update: Partial<RemindersRow>;
      }
      residency_partners: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          website_url: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<ResidencyPartnerRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<ResidencyPartnerRow>;
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper type to bypass Supabase typing issues temporarily
export type SupabaseClient = ReturnType<typeof import('@supabase/supabase-js').createClient>;