import { supabase } from '@/integrations/supabase/client';
import { type EventData, type NewEvent, type Tag } from '@/lib/types';
import { getRandomEventImage } from '@/lib/utils/images';
import { log } from '@/lib/utils/logger';

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

  return data.map(event => ({
    ...event,
    image_url: (event as any).image_url || getRandomEventImage(),
  }));
}

export async function getEventBySlug(slug: string): Promise<EventData | null> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_tags (
        tag_id,
        tags (*)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    log.error('Error fetching event:', error);
    return null;
  }

  return {
    ...data,
    image_url: (data as any).image_url || getRandomEventImage(),
  };
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