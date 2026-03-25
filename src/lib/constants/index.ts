import { api } from '@/lib/api';
import { log } from '@/lib/utils/logger';

export async function getUserTypes(): Promise<string[]> {
  try {
    const data = await api.get<string[]>('/api/constants/user-types');
    return data.length > 0 ? data : ['Admin', 'Staff', 'Alum'];
  } catch (error) {
    log.error('Error fetching user types:', error);
    return ['Admin', 'Staff', 'Alum'];
  }
}

export async function getEventTags(): Promise<Array<{ name: string; color: string }>> {
  try {
    return await api.get<Array<{ name: string; color: string }>>('/api/constants/event-tags');
  } catch (error) {
    log.error('Error fetching event tags:', error);
    return [
      { name: 'Networking', color: '#10b981' },
      { name: 'Workshop', color: '#f59e0b' },
      { name: 'Social', color: '#ef4444' },
      { name: 'Career', color: '#8b5cf6' },
      { name: 'Technical', color: '#06b6d4' },
      { name: 'Online', color: '#6366f1' },
      { name: 'In-Person', color: '#f97316' }
    ];
  }
}

let cachedUserTypes: string[] | null = null;

let cachedEventTags: Array<{ name: string; color: string }> | null = null;

export async function initializeConstants() {
  try {
    const [userTypes, eventTags] = await Promise.all([
      getUserTypes(),
      getEventTags()
    ]);

    cachedUserTypes = userTypes;
    cachedEventTags = eventTags;

    log.info('Constants initialized from database');
  } catch (error) {
    log.error('Error initializing constants:', error);
  }
}

export function getUserTypesSync(): string[] {
  return cachedUserTypes || [];
}

export function getEventTagsSync(): Array<{ name: string; color: string }> {
  return cachedEventTags || [
    { name: 'Networking', color: '#10b981' },
    { name: 'Workshop', color: '#f59e0b' },
    { name: 'Social', color: '#ef4444' },
    { name: 'Career', color: '#8b5cf6' },
    { name: 'Technical', color: '#06b6d4' },
    { name: 'Online', color: '#6366f1' },
    { name: 'In-Person', color: '#f97316' }
  ];
}

export function isValidUserType(value: string): boolean {
  return getUserTypesSync().includes(value);
}

export function isValidEventTag(value: string): boolean {
  return getEventTagsSync().some(tag => tag.name === value);
}

export function getEventTagColor(tagName: string): string {
  const tags = getEventTagsSync();
  const tag = tags.find(t => t.name === tagName);
  return tag?.color || '#3b82f6';
}

export function canUserCreateContent(userType: string | null): boolean {
  if (!userType) return false;
  return userType === 'Admin' || userType === 'Staff';
}

export function isAdmin(userType: string | null): boolean {
  if (!userType) return false;
  return userType === 'Admin';
}

export function isStaffOrAdmin(userType: string | null): boolean {
  if (!userType) return false;
  return userType === 'Admin' || userType === 'Staff';
}

export function canUserCreateEvents(userType: string | null): boolean {
  return isAdmin(userType);
}

export function canUserCreateAnnouncements(userType: string | null): boolean {
  return isStaffOrAdmin(userType);
}


export function getUserTypeOptions(): Array<{ value: string; label: string }> {
  return getUserTypesSync().map(type => ({
    value: type,
    label: type
  }));
}

export function getEventTagOptions(): Array<{ value: string; label: string; color: string }> {
  return getEventTagsSync().map(tag => ({
    value: tag.name,
    label: tag.name,
    color: tag.color
  }));
}
