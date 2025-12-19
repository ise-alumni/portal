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
      organiser?: { id: string; full_name: string | null; email: string } | null;
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

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
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
    .eq('id', id)
    .single();

  if (!data) {
    return null;
  }

  const announcement = data as AnnouncementRow & { 
    organiser?: { id: string; full_name: string | null; email: string } | null;
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
  try {
    // Get current user's profile to set as organiser
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Create announcement without tags first
    const { data: createdAnnouncement, error: insertError } = await (supabase as SupabaseAny)
      .from('announcements')
      .insert({
        title: announcement.title,
        content: announcement.content,
        external_url: announcement.external_url,
        deadline: announcement.deadline,
        image_url: announcement.image_url,
        organiser_profile_id: (profile as { id: string })?.id || null,
        created_by: userId
      })
      .select()
      .single();

    if (insertError) {
      log.error('Error creating announcement:', insertError);
      return null;
    }

    // Now insert tag relationships if any tags were provided
    if (announcement.tag_ids && announcement.tag_ids.length > 0 && createdAnnouncement?.id) {
      const tagRelations = announcement.tag_ids.map(tagId => ({
        announcement_id: createdAnnouncement.id,
        tag_id: tagId
      }));

      const { error: tagInsertError } = await (supabase as SupabaseAny)
        .from('announcement_tags')
        .insert(tagRelations);

      if (tagInsertError) {
        log.error('Error inserting announcement tags:', tagInsertError);
        // Don't fail the entire operation if tag insertion fails
      }
    }

    const announcementData = createdAnnouncement as AnnouncementRow & { 
      organiser?: { id: string; full_name: string | null; email: string } | null;
      announcement_tags?: Array<{ 
        tag_id: string; 
        tags: { id: string; name: string; color: string } 
      }> 
    };

    return {
      id: announcementData.id,
      title: announcementData.title,
      content: announcementData.content,
      external_url: announcementData.external_url,
      deadline: announcementData.deadline,
      image_url: announcementData.image_url || 'https://placehold.co/600x400',
      created_by: announcementData.created_by,
      created_at: announcementData.created_at,
      updated_at: announcementData.updated_at,
      slug: announcementData.slug,
      organiser_profile_id: announcementData.organiser_profile_id,
      organiser: announcementData.organiser,
      tags: announcementData.announcement_tags?.map((tagRelation) => ({
        id: tagRelation.tags.id,
        name: tagRelation.tags.name,
        color: tagRelation.tags.color
      })) || []
    };
  } catch (err) {
    log.error('Error creating announcement:', err);
    return null;
  }
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      log.error('Error deleting announcement:', error);
      return false;
    }

    return true;
  } catch (error) {
    log.error('Error in deleteAnnouncement:', error);
    return false;
  }
}

export async function getAnnouncementsByUserId(userId: string): Promise<Announcement[]> {
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
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    log.error('Error fetching announcements by user ID:', error);
    return [];
  }

  return data?.map((announcement) => {
    const ann = announcement as AnnouncementRow & { 
      organiser?: { id: string; full_name: string | null; email: string } | null;
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