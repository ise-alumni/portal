import { supabase } from '@/integrations/supabase/client';
import { type Announcement, type NewAnnouncement, type Tag } from '@/lib/types';
import { log } from '@/lib/utils/logger';
import type { Database, AnnouncementRow } from '@/integrations/supabase/types';
import { transformAnnouncement, ANNOUNCEMENT_SELECT_QUERY, type AnnouncementWithRelations } from './announcements-helpers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(ANNOUNCEMENT_SELECT_QUERY)
    .order('created_at', { ascending: false });

  if (error) {
    log.error('Error fetching announcements:', error);
    return [];
  }

  return data?.map((announcement) => transformAnnouncement(announcement as AnnouncementWithRelations)) || [];
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from('announcements')
    .select(ANNOUNCEMENT_SELECT_QUERY)
    .eq('id', id)
    .single();

  if (!data) {
    return null;
  }

  return transformAnnouncement(data as AnnouncementWithRelations);
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

    return transformAnnouncement(createdAnnouncement as AnnouncementWithRelations);
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
    .select(ANNOUNCEMENT_SELECT_QUERY)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    log.error('Error fetching announcements by user ID:', error);
    return [];
  }

  return data?.map((announcement) => transformAnnouncement(announcement as AnnouncementWithRelations)) || [];
}