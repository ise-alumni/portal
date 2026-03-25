/* eslint-disable @typescript-eslint/no-explicit-any */
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

vi.mock('@/lib/auth-client', () => ({
  signUp: {
    email: vi.fn(),
  },
}));

vi.mock('../profiles', () => ({
  getProfiles: vi.fn(),
  getUserActivity: vi.fn(),
}));

import { api } from '@/lib/api';
import { log } from '@/lib/utils/logger';
import { signUp } from '@/lib/auth-client';
import { getProfiles, getUserActivity } from '../profiles';
import {
  createUserWithProfile,
  removeUser,
  refreshUserData,
} from '../admin';

describe('Admin domain functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('createUserWithProfile', () => {
    it('should create user and update profile successfully', async () => {
      vi.mocked(signUp.email).mockResolvedValue({ error: null } as any);

      const mockProfile = { id: 'p1', user_id: 'u1', email: 'test@example.com' };
      vi.mocked(getProfiles).mockResolvedValue([mockProfile] as any);
      vi.mocked(api.put).mockResolvedValue(undefined);

      const promise = createUserWithProfile({
        email: 'test@example.com',
        fullName: 'Test User',
        graduationYear: '2020',
        userType: 'Alum',
        msc: false,
      });

      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(signUp.email).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com',
        name: 'Test User',
      }));
      expect(api.put).toHaveBeenCalledWith(`/api/profiles/u1`, expect.objectContaining({
        user_type: 'Alum',
        graduation_year: 2020,
        msc: false,
      }));
      expect(result.success).toBe(true);
    });

    it('should handle signup errors', async () => {
      vi.mocked(signUp.email).mockResolvedValue({
        error: { message: 'Email already exists' },
      } as any);

      const result = await createUserWithProfile({
        email: 'test@example.com',
        fullName: 'Test User',
        userType: 'Alum',
        msc: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
      expect(log.error).toHaveBeenCalledWith('Error creating auth user:', expect.anything());
    });

    it('should handle profile not found after signup', async () => {
      vi.mocked(signUp.email).mockResolvedValue({ error: null } as any);
      vi.mocked(getProfiles).mockResolvedValue([]);

      const promise = createUserWithProfile({
        email: 'test@example.com',
        fullName: 'Test User',
        userType: 'Alum',
        msc: false,
      });

      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('profile not found');
    });

    it('should handle profile update errors', async () => {
      vi.mocked(signUp.email).mockResolvedValue({ error: null } as any);

      const mockProfile = { id: 'p1', user_id: 'u1', email: 'test@example.com' };
      vi.mocked(getProfiles).mockResolvedValue([mockProfile] as any);
      vi.mocked(api.put).mockRejectedValue(new Error('Update failed'));

      const promise = createUserWithProfile({
        email: 'test@example.com',
        fullName: 'Test User',
        userType: 'Alum',
        msc: false,
      });

      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Profile update failed');
    });

    it('should handle unexpected errors', async () => {
      vi.mocked(signUp.email).mockRejectedValue(new Error('Network error'));

      const result = await createUserWithProfile({
        email: 'test@example.com',
        fullName: 'Test User',
        userType: 'Alum',
        msc: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('removeUser', () => {
    it('should remove user successfully', async () => {
      vi.mocked(api.put).mockResolvedValue(undefined);

      const result = await removeUser('p1');

      expect(api.put).toHaveBeenCalledWith('/api/profiles/remove/p1', {});
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Remove failed'));

      const result = await removeUser('p1');

      expect(log.error).toHaveBeenCalledWith('Error removing user:', expect.any(Error));
      expect(result).toBe(false);
    });
  });

  describe('refreshUserData', () => {
    it('should refresh user data successfully', async () => {
      const mockProfiles = [{ id: '1', full_name: 'Test User' }];
      const mockActivity = [{ id: '1', userId: '1', email: 'test@example.com' }];

      vi.mocked(getProfiles).mockResolvedValue(mockProfiles as any);
      vi.mocked(getUserActivity).mockResolvedValue(mockActivity as any);

      const result = await refreshUserData();

      expect(result.profiles).toEqual(mockProfiles);
      expect(result.userActivity).toEqual(mockActivity);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(getProfiles).mockRejectedValue(new Error('Fetch failed'));

      const result = await refreshUserData();

      expect(log.error).toHaveBeenCalledWith('Error refreshing user data:', expect.any(Error));
      expect(result.profiles).toEqual([]);
      expect(result.userActivity).toEqual([]);
    });
  });
});
