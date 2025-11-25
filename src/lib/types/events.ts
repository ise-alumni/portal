import { Database } from '@/integrations/supabase/types';

export interface EventTagType {
  id: string;
  name: string;
  color: string;
}

export interface EventTag {
  tag_id: string;
  tags: EventTagType;
}

export interface EventOrganiser {
  id: string;
  full_name: string | null;
  email: string | null;
}

export interface EventData {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  location_url: string | null;
  registration_url: string | null;
  start_at: string;
  end_at: string | null;
  organiser_profile_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  event_tags?: EventTag[];
  organiser?: EventOrganiser;
}

export interface NewEvent {
  title: string;
  description: string | null;
  location: string | null;
  location_url: string | null;
  registration_url: string | null;
  start_at: string;
  end_at: string | null;
  organiser_profile_id: string | null;
  image_url: string | null;
  event_tags?: string[]; // Array of tag IDs
}

export type EventSortBy = 'date' | 'title';
export type EventView = 'upcoming' | 'past';

// Re-export Supabase types for compatibility
export type EventTable = Database['public']['Tables']['events']['Row'];
export type TagTable = Database['public']['Tables']['tags']['Row'];
export type EventTagTable = Database['public']['Tables']['event_tags']['Row'];