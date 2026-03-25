import { api } from '@/lib/api';
import { type Announcement, type NewAnnouncement } from '@/lib/types';
import { log } from '@/lib/utils/logger';

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    return await api.get<Announcement[]>('/api/announcements');
  } catch (error) {
    log.error('Error fetching announcements:', error);
    return [];
  }
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  try {
    return await api.get<Announcement>(`/api/announcements/${id}`);
  } catch (error) {
    log.error('Error fetching announcement by ID:', error);
    return null;
  }
}

export async function getAnnouncementsByUserId(userId: string): Promise<Announcement[]> {
  try {
    return await api.get<Announcement[]>(`/api/announcements/user/${userId}`);
  } catch (error) {
    log.error('Error fetching announcements by user ID:', error);
    return [];
  }
}

export async function createAnnouncement(announcement: NewAnnouncement, userId: string): Promise<Announcement | null> {
  try {
    return await api.post<Announcement>('/api/announcements', {
      ...announcement,
      created_by: userId,
    });
  } catch (error) {
    log.error('Error creating announcement:', error);
    return null;
  }
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    await api.delete(`/api/announcements/${id}`);
    return true;
  } catch (error) {
    log.error('Error deleting announcement:', error);
    return false;
  }
}

export function isAnnouncementExpired(announcement: Announcement): boolean {
  if (!announcement.deadline) return false;
  return new Date(announcement.deadline) < new Date();
}

export function isAnnouncementActive(announcement: Announcement): boolean {
  return !isAnnouncementExpired(announcement);
}
