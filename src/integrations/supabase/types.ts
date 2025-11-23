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

// Legacy Database interface for compatibility
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_offices: {
        Row: {
          address: string | null
          city: string
          company_id: string
          country: string
          created_at: string
          id: string
          is_headquarters: boolean | null
          latitude: number
          longitude: number
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city: string
          company_id: string
          country: string
          created_at?: string
          id?: string
          is_headquarters?: boolean | null
          latitude: number
          longitude: number
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string
          company_id?: string
          country?: string
          created_at?: string
          id?: string
          is_headquarters?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_offices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          id: string
          location: string | null
          location_url: string | null
          organiser_profile_id: string | null
          registration_url: string | null
          slug: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          location_url?: string | null
          organiser_profile_id?: string | null
          registration_url?: string | null
          slug?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          location_url?: string | null
          organiser_profile_id?: string | null
          registration_url?: string | null
          slug?: string | null
          start_at?: string
          title: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organiser_profile_id_fkey"
            columns: ["organiser_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          cohort: number | null
          company: string | null
          country: string | null
          created_at: string
          current_company_id: string | null
          current_office_id: string | null
          email: string | null
          email_visible: boolean | null
          full_name: string | null
          github_url: string | null
          graduation_year: number | null
          id: string
          is_public: boolean | null
          job_title: string | null
          linkedin_url: string | null
          msc: boolean | null
          position: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          user_type: 'Alum' | 'Staff' | 'Admin'
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cohort?: number | null
          company?: string | null
          country?: string | null
          created_at?: string
          current_company_id?: string | null
          current_office_id?: string | null
          email?: string | null
          email_visible?: boolean | null
          full_name?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          is_public?: boolean | null
          job_title?: string | null
          linkedin_url?: string | null
          msc?: boolean | null
          position?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          user_type?: 'Alum' | 'Staff' | 'Admin'
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cohort?: number | null
          company?: string | null
          country?: string | null
          created_at?: string
          current_company_id?: string | null
          current_office_id?: string | null
          email?: string | null
          email_visible?: boolean | null
          full_name?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          is_public?: boolean | null
          job_title?: string | null
          linkedin_url?: string | null
          msc?: boolean | null
          position?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          user_type?: 'Alum' | 'Staff' | 'Admin'
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_company_id_fkey"
            columns: ["current_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_current_office_id_fkey"
            columns: ["current_office_id"]
            isOneToOne: false
            referencedRelation: "company_offices"
            referencedColumns: ["id"]
          },
        ]
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