import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/utils/logger';

// Dynamic type fetching from database constraints and data

// User Types - fetched from DB constraint using information_schema
export async function getUserTypes(): Promise<string[]> {
  try {
    // Fetch user types from profiles table check constraint
    const { data, error } = await supabase
      .from('profiles')
      .select('user_type')
      .not('user_type', 'is', null);

    if (error) {
      throw error;
    }

    // Extract unique user types
    const uniqueTypes = [...new Set(data?.map(p => p.user_type).filter(Boolean) as string[])];
    return uniqueTypes.length > 0 ? uniqueTypes : ['Admin', 'Staff', 'Alum'];
  } catch (error) {
    log.error('Error fetching user types:', error);
    return ['Admin', 'Staff', 'Alum']; // Fallback
  }
  }
 
// Announcement Types - fetched from DB constraint using information_schema
export async function getAnnouncementTypes(): Promise<string[]> {
  try {
    // Fetch announcement types from announcements table check constraint
    const { data, error } = await supabase
      .from('announcements')
      .select('type')
      .not('type', 'is', null);

    if (error) {
      throw error;
    }

    // Extract unique announcement types
    const uniqueTypes = [...new Set(data?.map(a => a.type).filter(Boolean) as string[])];
    return uniqueTypes.length > 0 ? uniqueTypes : ['opportunity', 'news', 'lecture', 'program'];
  } catch (error) {
    log.error('Error fetching announcement types:', error);
    return ['opportunity', 'news', 'lecture', 'program']; // Fallback
  }
  }
 
// Event Tags - fetched dynamically from database
export async function getEventTags(): Promise<Array<{ name: string; color: string }>> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('name, color')
      .order('name');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    log.error('Error fetching event tags:', error);
    // Fallback to basic tags if DB is unavailable
    return [
      { name: 'Networking', color: '#10b981' },
      { name: 'Workshop', color: '#f59e0b' },
      { name: 'Social', color: '#ef4444' },
      { name: 'Career', color: '#8b5cf6' },
      { name: 'Technical', color: '#06b6d4' },
      { name: 'Alumni', color: '#84cc16' },
      { name: 'Online', color: '#6366f1' },
      { name: 'In-Person', color: '#f97316' }
    ];
  }
}

// Cached versions for immediate use (will be updated by async calls)
let cachedUserTypes: string[] | null = null;
let cachedAnnouncementTypes: string[] | null = null;
let cachedEventTags: Array<{ name: string; color: string }> | null = null;

// Initialize cache on module load
export async function initializeConstants() {
  try {
    const [userTypes, announcementTypes, eventTags] = await Promise.all([
      getUserTypes(),
      getAnnouncementTypes(),
      getEventTags()
    ]);

    cachedUserTypes = userTypes;
    cachedAnnouncementTypes = announcementTypes;
    cachedEventTags = eventTags;

    log.info('Constants initialized from database');
  } catch (error) {
    log.error('Error initializing constants:', error);
  }
}

// Synchronous getters for immediate use (with fallbacks)
export function getUserTypesSync(): string[] {
  return cachedUserTypes || [];
}

export function getAnnouncementTypesSync(): string[] {
  return cachedAnnouncementTypes || [];
}

export function getEventTagsSync(): Array<{ name: string; color: string }> {
  return cachedEventTags || [
    { name: 'Networking', color: '#10b981' },
    { name: 'Workshop', color: '#f59e0b' },
    { name: 'Social', color: '#ef4444' },
    { name: 'Career', color: '#8b5cf6' },
    { name: 'Technical', color: '#06b6d4' },
    { name: 'Alumni', color: '#84cc16' },
    { name: 'Online', color: '#6366f1' },
    { name: 'In-Person', color: '#f97316' }
  ];
}

// Helper functions using cached data
export function isValidUserType(value: string): boolean {
  return getUserTypesSync().includes(value);
}

export function isValidAnnouncementType(value: string): boolean {
  return getAnnouncementTypesSync().includes(value);
}

export function isValidEventTag(value: string): boolean {
  return getEventTagsSync().some(tag => tag.name === value);
}

export function getEventTagColor(tagName: string): string {
  const tags = getEventTagsSync();
  const tag = tags.find(t => t.name === tagName);
  return tag?.color || '#3b82f6'; // Default blue
}

export function canUserCreateContent(userType: string | null): boolean {
  if (!userType) return false;
  const validTypes = getUserTypesSync();
  return userType === 'Admin' || userType === 'Staff';
}

export function isAdmin(userType: string | null): boolean {
  if (!userType) return false;
  const validTypes = getUserTypesSync();
  return userType === 'Admin' || userType === 'Staff';
}

// Type definitions for better TypeScript support
export type UserType = string; // Could be made more specific with DB schema
export type AnnouncementType = string; // Could be made more specific with DB schema
export type EventTagName = string;
export type EventTagColor = string;

// Export convenience arrays for UI components
export function getUserTypeOptions(): Array<{ value: string; label: string }> {
  return getUserTypesSync().map(type => ({
    value: type,
    label: type
  }));
}

export function getAnnouncementTypeOptions(): Array<{ value: string; label: string }> {
  const types = getAnnouncementTypesSync();
  return types.map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1) // Capitalize first letter
  }));
}

export function getEventTagOptions(): Array<{ value: string; label: string; color: string }> {
  return getEventTagsSync().map(tag => ({
    value: tag.name,
    label: tag.name,
    color: tag.color
  }));
}