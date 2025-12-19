import type { Announcement, Tag } from '@/lib/types';
import type { AnnouncementRow } from '@/integrations/supabase/types';

/**
 * Type for announcement data from Supabase with relations
 */
export type AnnouncementWithRelations = AnnouncementRow & {
  organiser?: { id: string; full_name: string | null; email: string } | null;
  announcement_tags?: Array<{
    tag_id: string;
    tags: { id: string; name: string; color: string };
  }>;
};

/**
 * Transforms Supabase announcement data to Announcement type
 */
export function transformAnnouncement(announcement: AnnouncementWithRelations): Announcement {
  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    external_url: announcement.external_url,
    deadline: announcement.deadline,
    image_url: announcement.image_url || 'https://placehold.co/600x400',
    created_by: announcement.created_by,
    created_at: announcement.created_at,
    updated_at: announcement.updated_at,
    slug: announcement.slug,
    organiser_profile_id: announcement.organiser_profile_id,
    organiser: announcement.organiser,
    tags: announcement.announcement_tags?.map((tagRelation) => ({
      id: tagRelation.tags.id,
      name: tagRelation.tags.name,
      color: tagRelation.tags.color
    })) || []
  };
}

/**
 * Common select query for announcements with relations
 */
export const ANNOUNCEMENT_SELECT_QUERY = `
  *,
  organiser:organiser_profile_id (
    id,
    full_name,
    email
  ),
  announcement_tags!inner(
    tag_id,
    tags!inner(
      id,
      name,
      color
    )
  )
`;

