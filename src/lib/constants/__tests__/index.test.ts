import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('Constants functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getUserTypes', () => {
    it('should fetch user types from API successfully', async () => {
      vi.mocked(api.get).mockResolvedValue(['Admin', 'Staff', 'Alum']);

      const { getUserTypes } = await import('../index');
      const result = await getUserTypes();

      expect(api.get).toHaveBeenCalledWith('/api/constants/user-types');
      expect(result).toEqual(['Admin', 'Staff', 'Alum']);
    });

    it('should return fallback types when API returns empty array', async () => {
      vi.mocked(api.get).mockResolvedValue([]);

      const { getUserTypes } = await import('../index');
      const result = await getUserTypes();

      expect(result).toEqual(['Admin', 'Staff', 'Alum']);
    });

    it('should return fallback types on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

      const { getUserTypes } = await import('../index');
      const result = await getUserTypes();

      expect(log.error).toHaveBeenCalledWith('Error fetching user types:', expect.any(Error));
      expect(result).toEqual(['Admin', 'Staff', 'Alum']);
    });
  });

  describe('getEventTags', () => {
    it('should fetch event tags from API successfully', async () => {
      const mockTags = [
        { name: 'Networking', color: '#10b981' },
        { name: 'Workshop', color: '#f59e0b' },
      ];
      vi.mocked(api.get).mockResolvedValue(mockTags);

      const { getEventTags } = await import('../index');
      const result = await getEventTags();

      expect(api.get).toHaveBeenCalledWith('/api/constants/event-tags');
      expect(result).toEqual(mockTags);
    });

    it('should return fallback tags on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Failed'));

      const { getEventTags } = await import('../index');
      const result = await getEventTags();

      expect(log.error).toHaveBeenCalledWith('Error fetching event tags:', expect.any(Error));
      expect(result).toEqual([
        { name: 'Networking', color: '#10b981' },
        { name: 'Workshop', color: '#f59e0b' },
        { name: 'Social', color: '#ef4444' },
        { name: 'Career', color: '#8b5cf6' },
        { name: 'Technical', color: '#06b6d4' },
        { name: 'Online', color: '#6366f1' },
        { name: 'In-Person', color: '#f97316' },
      ]);
    });
  });

  describe('initializeConstants', () => {
    it('should initialize all constants successfully', async () => {
      vi.mocked(api.get).mockImplementation((path: string) => {
        if (path === '/api/constants/user-types') return Promise.resolve(['Admin', 'Staff', 'Alum']);
        if (path === '/api/constants/event-tags') return Promise.resolve([{ name: 'Networking', color: '#10b981' }]);
        return Promise.resolve([]);
      });

      const { initializeConstants } = await import('../index');
      await initializeConstants();

      expect(log.info).toHaveBeenCalledWith('Constants initialized from database');
    });

    it('should handle initialization errors gracefully', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Init failed'));

      const { initializeConstants } = await import('../index');
      await initializeConstants();

      expect(log.error).toHaveBeenCalled();
    });
  });

  describe('Synchronous getters', () => {
    it('should return empty/fallback values when cache is not initialized', async () => {
      const { getUserTypesSync, getEventTagsSync } = await import('../index');

      expect(getUserTypesSync()).toEqual([]);
      expect(getEventTagsSync()).toEqual([
        { name: 'Networking', color: '#10b981' },
        { name: 'Workshop', color: '#f59e0b' },
        { name: 'Social', color: '#ef4444' },
        { name: 'Career', color: '#8b5cf6' },
        { name: 'Technical', color: '#06b6d4' },
        { name: 'Online', color: '#6366f1' },
        { name: 'In-Person', color: '#f97316' },
      ]);
    });

    it('should return cached values after initialization', async () => {
      vi.mocked(api.get).mockImplementation((path: string) => {
        if (path === '/api/constants/user-types') return Promise.resolve(['Admin', 'Staff', 'Alum']);
        if (path === '/api/constants/event-tags') return Promise.resolve([{ name: 'Workshop', color: '#f59e0b' }]);
        return Promise.resolve([]);
      });

      const { initializeConstants, getUserTypesSync, getEventTagsSync } = await import('../index');
      await initializeConstants();

      expect(getUserTypesSync()).toEqual(['Admin', 'Staff', 'Alum']);
      expect(getEventTagsSync()).toEqual([{ name: 'Workshop', color: '#f59e0b' }]);
    });
  });

  describe('Validation functions', () => {
    beforeEach(async () => {
      vi.mocked(api.get).mockImplementation((path: string) => {
        if (path === '/api/constants/user-types') return Promise.resolve(['Admin', 'Staff', 'Alum']);
        if (path === '/api/constants/event-tags') {
          return Promise.resolve([
            { name: 'Networking', color: '#10b981' },
            { name: 'Workshop', color: '#f59e0b' },
          ]);
        }
        return Promise.resolve([]);
      });

      const { initializeConstants } = await import('../index');
      await initializeConstants();
    });

    it('should validate user types correctly', async () => {
      const { isValidUserType } = await import('../index');

      expect(isValidUserType('Admin')).toBe(true);
      expect(isValidUserType('Staff')).toBe(true);
      expect(isValidUserType('Alum')).toBe(true);
      expect(isValidUserType('Invalid')).toBe(false);
    });

    it('should validate event tags correctly', async () => {
      const { isValidEventTag } = await import('../index');

      expect(isValidEventTag('Networking')).toBe(true);
      expect(isValidEventTag('Workshop')).toBe(true);
      expect(isValidEventTag('Invalid')).toBe(false);
    });

    it('should get event tag color correctly', async () => {
      const { getEventTagColor } = await import('../index');

      expect(getEventTagColor('Networking')).toBe('#10b981');
      expect(getEventTagColor('Workshop')).toBe('#f59e0b');
      expect(getEventTagColor('Unknown')).toBe('#3b82f6');
    });
  });

  describe('Permission functions', () => {
    it('should check content creation permissions correctly', async () => {
      const { canUserCreateContent } = await import('../index');

      expect(canUserCreateContent('Admin')).toBe(true);
      expect(canUserCreateContent('Staff')).toBe(true);
      expect(canUserCreateContent('Alum')).toBe(false);
      expect(canUserCreateContent(null)).toBe(false);
    });

    it('should check admin permissions correctly', async () => {
      const { isAdmin } = await import('../index');

      expect(isAdmin('Admin')).toBe(true);
      expect(isAdmin('Staff')).toBe(false);
      expect(isAdmin('Alum')).toBe(false);
      expect(isAdmin(null)).toBe(false);
    });

    it('should check staff or admin permissions correctly', async () => {
      const { isStaffOrAdmin } = await import('../index');

      expect(isStaffOrAdmin('Admin')).toBe(true);
      expect(isStaffOrAdmin('Staff')).toBe(true);
      expect(isStaffOrAdmin('Alum')).toBe(false);
      expect(isStaffOrAdmin(null)).toBe(false);
    });
  });

  describe('Option generators', () => {
    beforeEach(async () => {
      vi.mocked(api.get).mockImplementation((path: string) => {
        if (path === '/api/constants/user-types') return Promise.resolve(['Admin', 'Staff', 'Alum']);
        if (path === '/api/constants/event-tags') {
          return Promise.resolve([
            { name: 'Networking', color: '#10b981' },
            { name: 'Workshop', color: '#f59e0b' },
          ]);
        }
        return Promise.resolve([]);
      });

      const { initializeConstants } = await import('../index');
      await initializeConstants();
    });

    it('should generate user type options correctly', async () => {
      const { getUserTypeOptions } = await import('../index');

      expect(getUserTypeOptions()).toEqual([
        { value: 'Admin', label: 'Admin' },
        { value: 'Staff', label: 'Staff' },
        { value: 'Alum', label: 'Alum' },
      ]);
    });

    it('should generate event tag options correctly', async () => {
      const { getEventTagOptions } = await import('../index');

      expect(getEventTagOptions()).toEqual([
        { value: 'Networking', label: 'Networking', color: '#10b981' },
        { value: 'Workshop', label: 'Workshop', color: '#f59e0b' },
      ]);
    });
  });
});
