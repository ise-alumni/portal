import { supabase } from '@/integrations/supabase/client';
import { type Announcement, type NewAnnouncement, type Tag } from '@/lib/types';
import { log } from '@/lib/utils/logger';
import type { Database, AnnouncementRow } from '@/integrations/supabase/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
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
    `)
    .order('created_at', { ascending: false });

  if (error) {
    log.error('Error fetching announcements:', error);
    return [];
  }

  return data?.map((announcement) => {
    const ann = announcement as AnnouncementRow & { 
      organiser?: { id: string; full_name: string | null; email: string | null } | null;
      announcement_tags?: Array<{ 
        tag_id: string; 
        tags: { id: string; name: string; color: string } 
      }> 
    };
    
    return {
      id: ann.id,
      title: ann.title,
      content: ann.content,
      external_url: ann.external_url,
      deadline: ann.deadline,
      image_url: ann.image_url || 'https://placehold.co/600x400',
      created_by: ann.created_by,
      created_at: ann.created_at,
      updated_at: ann.updated_at,
      slug: ann.slug,
      organiser_profile_id: ann.organiser_profile_id,
      organiser: ann.organiser,
      tags: ann.announcement_tags?.map((tagRelation) => ({
        id: tagRelation.tags.id,
        name: tagRelation.tags.name,
        color: tagRelation.tags.color
      })) || []
    };
  }) || [];
}

export async function getAnnouncementBySlug(slug: string): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
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
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    log.error('Error fetching announcement:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  const announcement = data as AnnouncementRow & { 
    organiser?: { id: string; full_name: string | null; email: string | null } | null;
    announcement_tags?: Array<{ 
      tag_id: string; 
        tags: { id: string; name: string; color: string } 
    }> 
  };
  
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

export function isAnnouncementExpired(announcement: Announcement): boolean {
  if (!announcement.deadline) return false;
  return new Date(announcement.deadline) < new Date();
}

export function isAnnouncementActive(announcement: Announcement): boolean {
  return !isAnnouncementExpired(announcement);
}

export async function createAnnouncement(announcement: NewAnnouncement, userId: string): Promise<Announcement | null> {
  // First create announcement
  const { data, error } = await (supabase
    .from('announcements') as SupabaseAny)
    .insert({
      title: announcement.title,
      content: announcement.content,
      external_url: announcement.external_url,
      deadline: announcement.deadline,
      image_url: announcement.image_url,
      organiser_profile_id: announcement.organiser_profile_id,
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
    
    const { error: tagError } = await (supabase.from('announcement_tags') as SupabaseAny)
      .insert(tagRelations);

    if (tagError) {
      log.error('Error associating tags with announcement:', tagError);
      // Don't return null here - announcement was created successfully
    }
  }

  return {
    ...data,
    image_url: data.image_url || 'https://placehold.co/600x400',
    organiser_profile_id: data.organiser_profile_id,
    organiser: null, // Will be populated when fetched again
    tags: [] // Will be populated when fetched again
  };
}