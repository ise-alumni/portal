import { Tables } from '@/integrations/supabase/types';

export type AnnouncementType = 'opportunity' | 'news' | 'lecture' | 'program';

export interface Announcement {
  id: string;
  title: string;
  content: string | null;
  type: AnnouncementType;
  external_url: string | null;
  deadline: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  slug: string | null;
}

export interface NewAnnouncement {
  title: string;
  content: string | null;
  type: AnnouncementType;
  external_url: string | null;
  deadline: string | null;
  image_url: string | null;
}

export type AnnouncementSortBy = 'created_at' | 'deadline' | 'title';
export type AnnouncementView = 'current' | 'past';

// Re-export Supabase types for compatibility
export type AnnouncementTable = Tables<'announcements'>;