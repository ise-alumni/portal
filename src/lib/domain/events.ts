import { supabase } from '@/integrations/supabase/client';
import { type EventData, type NewEvent, type Tag } from '@/lib/types';
import { log } from '@/lib/utils/logger';

// Temporary interface for Supabase response
interface SupabaseEvent {
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
  event_tags?: Array<{
    tag_id: string;
    tags: Tag;
  }>;
  organiser?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export async function getEvents(): Promise<EventData[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_tags (
        tag_id,
        tags (*)
      )
    `)
    .order('start_at', { ascending: true });

  if (error) {
    log.error('Error fetching events:', error);
    return [];
  }

  return (data || []).map((event: SupabaseEvent) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    location_url: event.location_url,
    registration_url: event.registration_url || null,
    start_at: event.start_at,
    end_at: event.end_at,
    organiser_profile_id: event.organiser_profile_id,
    created_by: event.created_by,
    created_at: event.created_at,
    updated_at: event.updated_at,
    image_url: event.image_url || 'https://placehold.co/600x400',
    event_tags: event.event_tags,
    organiser: event.organiser,
  }));
}



export async function getTags(): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) {
      log.error('Error fetching tags:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    log.error('Error in getTags:', error);
    return [];
  }
}

export async function createTag(name: string, color: string): Promise<Tag | null> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .insert({ name, color })
      .select()
      .single();

    if (error) {
      log.error('Error creating tag:', error);
      return null;
    }

    return data;
  } catch (error) {
    log.error('Error in createTag:', error);
    return null;
  }
}

export async function updateTag(id: string, name: string, color: string): Promise<Tag | null> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .update({ name, color })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      log.error('Error updating tag:', error);
      return null;
    }

    return data;
  } catch (error) {
    log.error('Error in updateTag:', error);
    return null;
  }
}

export async function deleteTag(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) {
      log.error('Error deleting tag:', error);
      return false;
    }

    return true;
  } catch (error) {
    log.error('Error in deleteTag:', error);
    return false;
  }
}

export async function getTagById(id: string): Promise<Tag | null> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      log.error('Error fetching tag:', error);
      return null;
    }

    return data;
  } catch (error) {
    log.error('Error in getTagById:', error);
    return null;
  }
}

export function isEventInPast(event: EventData): boolean {
  return new Date(event.end_at || event.start_at) < new Date();
}

export function isEventUpcoming(event: EventData): boolean {
  return new Date(event.start_at) > new Date();
}

export function isEventOngoing(event: EventData): boolean {
  const now = new Date();
  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : null;
  
  return start <= now && (!end || end >= now);
}