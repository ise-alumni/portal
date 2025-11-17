import { supabase } from '@/integrations/supabase/client';
import { type Announcement, type NewAnnouncement } from '@/lib/types';
import { getRandomAnnouncementImage } from '@/lib/utils/images';
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

  return data.map(announcement => ({
    ...announcement,
    image_url: (announcement as any).image_url || getRandomAnnouncementImage(),
    type: announcement.type as 'opportunity' | 'news' | 'lecture' | 'program',
  }));
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
    image_url: (data as any).image_url || getRandomAnnouncementImage(),
    type: data.type as 'opportunity' | 'news' | 'lecture' | 'program',
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
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      ...announcement,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    log.error('Error creating announcement:', error);
    return null;
  }

  return {
    ...data,
    image_url: (data as any).image_url || getRandomAnnouncementImage(),
    type: data.type as 'opportunity' | 'news' | 'lecture' | 'program',
  };
}