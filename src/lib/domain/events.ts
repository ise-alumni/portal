import { api } from '@/lib/api';
import { type EventData, type Tag } from '@/lib/types';
import { log } from '@/lib/utils/logger';

export async function getEvents(): Promise<EventData[]> {
  try {
    return await api.get<EventData[]>('/api/events');
  } catch (error) {
    log.error('Error fetching events:', error);
    return [];
  }
}

export async function getTags(): Promise<Tag[]> {
  try {
    return await api.get<Tag[]>('/api/tags');
  } catch (error) {
    log.error('Error fetching tags:', error);
    return [];
  }
}

export async function getEventById(id: string): Promise<EventData | null> {
  try {
    return await api.get<EventData>(`/api/events/${id}`);
  } catch (error) {
    log.error('Error fetching event by ID:', error);
    return null;
  }
}

export async function getEventsByUserId(userId: string): Promise<EventData[]> {
  try {
    return await api.get<EventData[]>(`/api/events/user/${userId}`);
  } catch (error) {
    log.error('Error fetching events by user ID:', error);
    return [];
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    await api.delete(`/api/events/${id}`);
    return true;
  } catch (error) {
    log.error('Error deleting event:', error);
    return false;
  }
}

export async function createTag(name: string, color: string): Promise<Tag | null> {
  try {
    return await api.post<Tag>('/api/tags', { name, color });
  } catch (error) {
    log.error('Error creating tag:', error);
    return null;
  }
}

export async function updateTag(id: string, name: string, color: string): Promise<Tag | null> {
  try {
    return await api.put<Tag>(`/api/tags/${id}`, { name, color });
  } catch (error) {
    log.error('Error updating tag:', error);
    return null;
  }
}

export async function deleteTag(id: string): Promise<boolean> {
  try {
    await api.delete(`/api/tags/${id}`);
    return true;
  } catch (error) {
    log.error('Error deleting tag:', error);
    return false;
  }
}

export async function getTagById(id: string): Promise<Tag | null> {
  try {
    return await api.get<Tag>(`/api/tags/${id}`);
  } catch (error) {
    log.error('Error fetching tag:', error);
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
