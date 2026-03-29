import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ProfileFormData } from '@/lib/types';
import { createMockProfile } from './test-helpers';

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
  getProfiles,
  getProfileById,
  getProfileByUserId,
  updateProfile,
  uploadAvatar,
  isProfileComplete,
  calculateProfileCompletionPercentage,
} from '../profiles';

const profileDefaults = {
  id: 'p1',
  user_id: 'u1',
  bio: 'Developer',
  city: 'Dublin',
  country: 'Ireland',
  cohort: 1,
  graduation_year: 2020,
  job_title: 'Engineer',
  is_remote: null,
  is_entrepreneur: null,
  is_ise_champion: null,
} as const;

const createTestProfile = (overrides = {}) =>
  createMockProfile({ ...profileDefaults, ...overrides });

describe('Profiles Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfiles', () => {
    it('should fetch profiles successfully', async () => {
      const mock = [createTestProfile(), createTestProfile({ id: 'p2', full_name: 'Jane' })];
      vi.mocked(api.get).mockResolvedValue(mock);

      const result = await getProfiles();

      expect(api.get).toHaveBeenCalledWith('/api/profiles');
      expect(result).toEqual(mock);
    });

    it('should return empty array on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Failed'));

      const result = await getProfiles();

      expect(log.error).toHaveBeenCalledWith('Error fetching profiles:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('getProfileById', () => {
    it('should fetch profile by id successfully', async () => {
      const mock = createTestProfile();
      vi.mocked(api.get).mockResolvedValue(mock);

      const result = await getProfileById('p1');

      expect(api.get).toHaveBeenCalledWith('/api/profiles/p1');
      expect(result).toEqual(mock);
    });

    it('should return null on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));

      const result = await getProfileById('p1');

      expect(log.error).toHaveBeenCalledWith('Error fetching profile by ID:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('getProfileByUserId', () => {
    it('should fetch profile by user id successfully', async () => {
      const mock = createTestProfile();
      vi.mocked(api.get).mockResolvedValue(mock);

      const result = await getProfileByUserId('u1');

      expect(api.get).toHaveBeenCalledWith('/api/profiles/user/u1');
      expect(result).toEqual(mock);
    });

    it('should return null on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Failed'));

      const result = await getProfileByUserId('u1');

      expect(log.error).toHaveBeenCalledWith('Error fetching profile by user ID:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updated = createTestProfile({ full_name: 'Updated Name' });
      vi.mocked(api.put).mockResolvedValue(updated);

      const formData: ProfileFormData = {
        fullName: 'Updated Name',
        city: 'Dublin',
        country: 'Ireland',
        graduationYear: '2020',
        msc: false,
        jobTitle: 'Engineer',
        company: 'Tech Corp',
        bio: 'Developer',
        githubUrl: '',
        linkedinUrl: '',
        twitterUrl: '',
        websiteUrl: '',
        avatarUrl: '',
        isRemote: false,
        isEntrepreneur: false,
        isIseChampion: false,
        professionalStatus: null,
      };

      const result = await updateProfile('u1', formData);

      expect(api.put).toHaveBeenCalledWith('/api/profiles/u1', expect.objectContaining({
        user_id: 'u1',
        full_name: 'Updated Name',
      }));
      expect(result).toEqual(updated);
    });

    it('should return null on error', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Update failed'));

      const formData: ProfileFormData = {
        fullName: 'X',
        city: '',
        country: '',
        graduationYear: '',
        msc: false,
        jobTitle: '',
        company: '',
        bio: '',
        githubUrl: '',
        linkedinUrl: '',
        twitterUrl: '',
        websiteUrl: '',
        avatarUrl: '',
        isRemote: false,
        isEntrepreneur: false,
        isIseChampion: false,
        professionalStatus: null,
      };

      const result = await updateProfile('u1', formData);

      expect(log.error).toHaveBeenCalledWith('Error updating profile:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('uploadAvatar', () => {
    it('should return null (stub)', async () => {
      const result = await uploadAvatar('u1', new File([''], 'avatar.png'));

      expect(log.warn).toHaveBeenCalledWith('Avatar upload not yet implemented with local storage');
      expect(result).toBeNull();
    });
  });

  describe('isProfileComplete', () => {
    it('should return true when all required fields are filled', () => {
      const profile = createTestProfile();
      expect(isProfileComplete(profile)).toBe(true);
    });

    it('should return false when required fields are missing', () => {
      const profile = createTestProfile({ bio: null, company: null });
      expect(isProfileComplete(profile)).toBe(false);
    });
  });

  describe('calculateProfileCompletionPercentage', () => {
    it('should return 100 for a complete profile', () => {
      const profile = createTestProfile();
      expect(calculateProfileCompletionPercentage(profile)).toBe(100);
    });

    it('should return 0 for null profile', () => {
      expect(calculateProfileCompletionPercentage(null)).toBe(0);
    });

    it('should return partial percentage', () => {
      const profile = createTestProfile({ bio: null, company: null });
      expect(calculateProfileCompletionPercentage(profile)).toBe(50);
    });
  });
});
