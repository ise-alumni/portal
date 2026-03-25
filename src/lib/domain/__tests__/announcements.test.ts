import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Announcement, type NewAnnouncement } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { api } from '@/lib/api';
import { log } from '@/lib/utils/logger';
import {
  getAnnouncements,
  getAnnouncementById,
  getAnnouncementsByUserId,
  createAnnouncement,
  deleteAnnouncement,
  isAnnouncementExpired,
  isAnnouncementActive,
} from '../announcements';

const createTestAnnouncement = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: 'a1',
  title: 'Test Announcement',
  content: 'Test content',
  external_url: null,
  deadline: '2025-12-31T00:00:00Z',
  image_url: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  created_by: 'user-1',
  organiser_profile_id: null,
  ...overrides,
});

describe('Announcements Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAnnouncements', () => {
    it('should fetch announcements successfully', async () => {
      const mock = [createTestAnnouncement(), createTestAnnouncement({ id: 'a2', title: 'Second' })];
      vi.mocked(api.get).mockResolvedValue(mock);

      const result = await getAnnouncements();

      expect(api.get).toHaveBeenCalledWith('/api/announcements');
      expect(result).toEqual(mock);
    });

    it('should return empty array on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

      const result = await getAnnouncements();

      expect(log.error).toHaveBeenCalledWith('Error fetching announcements:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('getAnnouncementById', () => {
    it('should fetch announcement by id successfully', async () => {
      const mock = createTestAnnouncement();
      vi.mocked(api.get).mockResolvedValue(mock);

      const result = await getAnnouncementById('a1');

      expect(api.get).toHaveBeenCalledWith('/api/announcements/a1');
      expect(result).toEqual(mock);
    });

    it('should return null on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));

      const result = await getAnnouncementById('a1');

      expect(log.error).toHaveBeenCalledWith('Error fetching announcement by ID:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('getAnnouncementsByUserId', () => {
    it('should fetch announcements by user id successfully', async () => {
      const mock = [createTestAnnouncement({ created_by: 'user-123' })];
      vi.mocked(api.get).mockResolvedValue(mock);

      const result = await getAnnouncementsByUserId('user-123');

      expect(api.get).toHaveBeenCalledWith('/api/announcements/user/user-123');
      expect(result).toEqual(mock);
    });

    it('should return empty array on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Failed'));

      const result = await getAnnouncementsByUserId('user-123');

      expect(log.error).toHaveBeenCalledWith('Error fetching announcements by user ID:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('createAnnouncement', () => {
    it('should create announcement successfully', async () => {
      const newAnnouncement: NewAnnouncement = {
        title: 'New Announcement',
        content: 'Content',
        external_url: null,
        deadline: null,
        image_url: null,
        organiser_profile_id: null,
      };
      const created = createTestAnnouncement({ title: 'New Announcement' });
      vi.mocked(api.post).mockResolvedValue(created);

      const result = await createAnnouncement(newAnnouncement, 'user-1');

      expect(api.post).toHaveBeenCalledWith('/api/announcements', {
        ...newAnnouncement,
        created_by: 'user-1',
      });
      expect(result).toEqual(created);
    });

    it('should return null on error', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Creation failed'));

      const result = await createAnnouncement(
        { title: 'X', content: null, external_url: null, deadline: null, image_url: null, organiser_profile_id: null },
        'user-1',
      );

      expect(log.error).toHaveBeenCalledWith('Error creating announcement:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delete announcement successfully', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      const result = await deleteAnnouncement('a1');

      expect(api.delete).toHaveBeenCalledWith('/api/announcements/a1');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Delete failed'));

      const result = await deleteAnnouncement('a1');

      expect(log.error).toHaveBeenCalledWith('Error deleting announcement:', expect.any(Error));
      expect(result).toBe(false);
    });
  });

  describe('isAnnouncementExpired', () => {
    it('should return true for expired announcements', () => {
      const expired = createTestAnnouncement({ deadline: '2020-01-01T00:00:00Z' });
      expect(isAnnouncementExpired(expired)).toBe(true);
    });

    it('should return false for active announcements', () => {
      const active = createTestAnnouncement({ deadline: '2099-12-31T00:00:00Z' });
      expect(isAnnouncementExpired(active)).toBe(false);
    });

    it('should return false when no deadline', () => {
      const noDeadline = createTestAnnouncement({ deadline: null });
      expect(isAnnouncementExpired(noDeadline)).toBe(false);
    });
  });

  describe('isAnnouncementActive', () => {
    it('should return true for non-expired announcements', () => {
      const active = createTestAnnouncement({ deadline: '2099-12-31T00:00:00Z' });
      expect(isAnnouncementActive(active)).toBe(true);
    });

    it('should return false for expired announcements', () => {
      const expired = createTestAnnouncement({ deadline: '2020-01-01T00:00:00Z' });
      expect(isAnnouncementActive(expired)).toBe(false);
    });
  });
});
