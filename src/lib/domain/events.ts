import { supabase } from '@/integrations/supabase/client';
import { type EventData, type NewEvent, type Tag } from '@/lib/types';
import { log } from '@/lib/utils/logger';
import { transformEvent, EVENT_ORGANISER_SELECT, EVENT_TAGS_SELECT, type EventWithRelations } from './events-helpers';

export async function getEvents(): Promise<EventData[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`*,${EVENT_TAGS_SELECT}`)
    .order('start_at', { ascending: true });

  if (error) {
    log.error('Error fetching events:', error);
    return [];
  }

  return (data || []).map((event) => transformEvent(event as EventWithRelations));
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

// Re-export tag functions from helpers
export { createTag, updateTag, deleteTag, getTagById } from './tags-helpers';

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

export async function getEventById(id: string): Promise<EventData | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`*,${EVENT_ORGANISER_SELECT},${EVENT_TAGS_SELECT}`)
      .eq('id', id)
      .single();

    if (error) {
      log.error('Error fetching event by ID:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return transformEvent(data as EventWithRelations);
  } catch (error) {
    log.error('Error in getEventById:', error);
    return null;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      log.error('Error deleting event:', error);
      return false;
    }

    return true;
  } catch (error) {
    log.error('Error in deleteEvent:', error);
    return false;
  }
}

export async function getEventsByUserId(userId: string): Promise<EventData[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`*,${EVENT_ORGANISER_SELECT},${EVENT_TAGS_SELECT}`)
      .eq('created_by', userId)
      .order('start_at', { ascending: false });

    if (error) {
      log.error('Error fetching events by user ID:', error);
      return [];
    }

    return (data || []).map((event) => transformEvent(event as EventWithRelations));
  } catch (error) {
    log.error('Error in getEventsByUserId:', error);
    return [];
  }
}