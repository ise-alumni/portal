import { Database } from '@/integrations/supabase/types';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string | null;
  external_url: string | null;
  deadline: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  slug: string | null;
  tags?: Tag[];
}

export interface NewAnnouncement {
  title: string;
  content: string | null;
  external_url: string | null;
  deadline: string | null;
  image_url: string | null;
  tag_ids?: string[];
}

export type AnnouncementSortBy = 'created_at' | 'deadline' | 'title';
export type AnnouncementView = 'current' | 'past';

// Re-export Supabase types for compatibility
export type AnnouncementTable = Database['public']['Tables']['announcements']['Row'];