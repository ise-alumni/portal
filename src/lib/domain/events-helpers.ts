import type { EventData, Tag } from '@/lib/types';

/**
 * Type for event data from Supabase with relations
 */
export type EventWithRelations = {
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
  organiser?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  event_tags?: Array<{
    tag_id: string;
    tags: Tag;
  }>;
};

/**
 * Transforms Supabase event data to EventData type
 */
export function transformEvent(event: EventWithRelations): EventData {
  return {
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
    event_tags: event.event_tags?.map((et) => ({
      tag_id: et.tag_id,
      tags: et.tags
    })) || [],
    organiser: event.organiser
  };
}

/**
 * Common select query for events with organiser
 */
export const EVENT_ORGANISER_SELECT = `
  organiser:organiser_profile_id (
    id,
    full_name,
    email
  )
`;

/**
 * Common select query for events with tags
 */
export const EVENT_TAGS_SELECT = `
  event_tags (
    tag_id,
    tags (
      id,
      name,
      color
    )
  )
`;

