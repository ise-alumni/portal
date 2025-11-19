import { supabase } from '@/integrations/supabase/client';
import { type Announcement, type NewAnnouncement, type Tag } from '@/lib/types';
import { log } from '@/lib/utils/logger';

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    log.error('Error fetching announcements:', error);
    return [];
  }

  return data?.map((announcement: any) => ({
    ...announcement,
    image_url: announcement.image_url || 'https://placehold.co/600x400',
    tags: [] // TODO: Fetch tags separately when relation is fixed
  })) || [];
}

export async function getAnnouncementBySlug(slug: string): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    log.error('Error fetching announcement:', error);
    return null;
  }

  return {
    ...data,
    image_url: (data as any).image_url || 'https://placehold.co/600x400',
    tags: [] // TODO: Fetch tags separately when relation is fixed
  };
}

export function isAnnouncementExpired(announcement: Announcement): boolean {
  if (!announcement.deadline) return false;
  return new Date(announcement.deadline) < new Date();
}

export function isAnnouncementActive(announcement: Announcement): boolean {
  return !isAnnouncementExpired(announcement);
}

export async function createAnnouncement(announcement: NewAnnouncement, userId: string): Promise<Announcement | null> {
  // First create announcement
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: announcement.title,
      content: announcement.content,
      external_url: announcement.external_url,
      deadline: announcement.deadline,
      image_url: announcement.image_url,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    log.error('Error creating announcement:', error);
    return null;
  }

  // Then associate tags if provided
  if (announcement.tag_ids && announcement.tag_ids.length > 0) {
    const tagRelations = announcement.tag_ids.map((tag_id: string) => ({
      announcement_id: data.id,
      tag_id
    }));
    
    // Skip tag association for now - TODO: Fix when database relations are working
    // const { error: tagError } = await (supabase.from('announcement_tags') as any)
    //   .insert(tagRelations);

    // if (tagError) {
    //   log.error('Error associating tags with announcement:', tagError);
    // }
  }

  return {
    ...data,
    image_url: (data as any).image_url || 'https://placehold.co/600x400',
    tags: [] // Will be populated when fetched again
  };
}