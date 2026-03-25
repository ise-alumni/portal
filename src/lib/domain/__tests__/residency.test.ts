import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Profile } from '@/lib/types/profiles';
import type { UserRole } from '@/lib/types/common';

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
  getResidencyPartners,
  createResidencyPartner,
  updateResidencyPartner,
  deleteResidencyPartner,
  getUserResidencies,
  createResidency,
  updateResidency,
  deleteResidency,
  getResidencyStats,
  getAvailablePhases,
} from '../residency';

const createTestProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: '1',
  user_id: 'user1',
  full_name: 'John Doe',
  email: 'john@example.com',
  bio: 'Engineer',
  company: 'Tech Corp',
  city: 'Dublin',
  country: 'Ireland',
  cohort: 1,
  graduation_year: 2020,
  job_title: 'Engineer',
  avatar_url: null,
  is_public: true,
  msc: false,
  user_type: 'Alum' as UserRole,
  removed: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  is_remote: null,
  is_entrepreneur: null,
  is_ise_champion: null,
  professional_status: null,
  github_url: null,
  linkedin_url: null,
  twitter_url: null,
  website_url: null,
  ...overrides,
});

describe('Residency Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getResidencyPartners', () => {
    it('should fetch residency partners successfully', async () => {
      const mockPartners = [
        { id: '1', name: 'Tech Corp', website: 'https://techcorp.com', logo_url: null, description: null, is_active: true, created_at: '', updated_at: '' },
      ];
      vi.mocked(api.get).mockResolvedValue(mockPartners);

      const result = await getResidencyPartners();

      expect(api.get).toHaveBeenCalledWith('/api/residency-partners');
      expect(result).toEqual(mockPartners);
    });

    it('should return empty array on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Failed'));

      const result = await getResidencyPartners();

      expect(log.error).toHaveBeenCalledWith('Error fetching residency partners:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('createResidencyPartner', () => {
    it('should create partner successfully', async () => {
      const newPartner = { name: 'New Partner', website: null, logo_url: null, description: null, is_active: true };
      const created = { id: '3', ...newPartner, created_at: '', updated_at: '' };
      vi.mocked(api.post).mockResolvedValue(created);

      const result = await createResidencyPartner(newPartner);

      expect(api.post).toHaveBeenCalledWith('/api/residency-partners', newPartner);
      expect(result).toEqual(created);
    });

    it('should return null on error', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Creation failed'));

      const result = await createResidencyPartner({ name: 'X', website: null, logo_url: null, description: null, is_active: true });

      expect(log.error).toHaveBeenCalledWith('Error creating residency partner:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('updateResidencyPartner', () => {
    it('should update partner successfully', async () => {
      const updated = { id: '1', name: 'Updated', website: null, logo_url: null, description: null, is_active: true, created_at: '', updated_at: '' };
      vi.mocked(api.put).mockResolvedValue(updated);

      const result = await updateResidencyPartner('1', { name: 'Updated' });

      expect(api.put).toHaveBeenCalledWith('/api/residency-partners/1', { name: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('should return null on error', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Update failed'));

      const result = await updateResidencyPartner('1', { name: 'Updated' });

      expect(log.error).toHaveBeenCalledWith('Error updating residency partner:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('deleteResidencyPartner', () => {
    it('should delete partner successfully', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      const result = await deleteResidencyPartner('1');

      expect(api.delete).toHaveBeenCalledWith('/api/residency-partners/1');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Delete failed'));

      const result = await deleteResidencyPartner('1');

      expect(log.error).toHaveBeenCalledWith('Error deleting residency partner:', expect.any(Error));
      expect(result).toBe(false);
    });
  });

  describe('getUserResidencies', () => {
    it('should fetch user residencies successfully', async () => {
      const mockResidencies = [
        { id: 'r1', phase: 'R1' as const, company_id: '1', user_id: 'user1', description: null, created_at: '', updated_at: '' },
      ];
      vi.mocked(api.get).mockResolvedValue(mockResidencies);

      const result = await getUserResidencies('user1');

      expect(api.get).toHaveBeenCalledWith('/api/residencies/user/user1');
      expect(result).toEqual(mockResidencies);
    });

    it('should return empty array on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Failed'));

      const result = await getUserResidencies('user1');

      expect(log.error).toHaveBeenCalledWith('Error fetching user residencies:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('createResidency', () => {
    it('should create residency successfully', async () => {
      const newResidency = { phase: 'R1' as const, company_id: '1', user_id: 'user1', description: null };
      const created = { id: 'r1', ...newResidency, created_at: '', updated_at: '' };
      vi.mocked(api.post).mockResolvedValue(created);

      const result = await createResidency(newResidency);

      expect(api.post).toHaveBeenCalledWith('/api/residencies', newResidency);
      expect(result).toEqual(created);
    });

    it('should return null on error', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Creation failed'));

      const result = await createResidency({ phase: 'R1', company_id: '1', user_id: 'user1', description: null });

      expect(log.error).toHaveBeenCalledWith('Error creating residency:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('updateResidency', () => {
    it('should update residency successfully', async () => {
      const updated = { id: 'r1', phase: 'R2' as const, company_id: '1', user_id: 'user1', description: 'Updated', created_at: '', updated_at: '' };
      vi.mocked(api.put).mockResolvedValue(updated);

      const result = await updateResidency('r1', { description: 'Updated' });

      expect(api.put).toHaveBeenCalledWith('/api/residencies/r1', { description: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('should return null on error', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Update failed'));

      const result = await updateResidency('r1', { description: 'Updated' });

      expect(log.error).toHaveBeenCalledWith('Error updating residency:', expect.any(Error));
      expect(result).toBeNull();
    });
  });

  describe('deleteResidency', () => {
    it('should delete residency successfully', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      const result = await deleteResidency('r1');

      expect(api.delete).toHaveBeenCalledWith('/api/residencies/r1');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Delete failed'));

      const result = await deleteResidency('r1');

      expect(log.error).toHaveBeenCalledWith('Error deleting residency:', expect.any(Error));
      expect(result).toBe(false);
    });
  });

  describe('getResidencyStats', () => {
    it('should calculate residency stats correctly', async () => {
      const mockPartners = [
        { id: '1', name: 'Tech Corp', website: null, logo_url: null, description: null, is_active: true, created_at: '', updated_at: '' },
        { id: '2', name: 'Google', website: null, logo_url: null, description: null, is_active: true, created_at: '', updated_at: '' },
      ];
      vi.mocked(api.get).mockResolvedValue(mockPartners);

      const profiles = [
        createTestProfile({ id: '1', company: 'Tech Corp' }),
        createTestProfile({ id: '2', company: 'Google', msc: true }),
      ];

      const result = await getResidencyStats(profiles);

      expect(result.totalProfiles).toBe(2);
      expect(result.atResidencyPartner).toBe(2);
      expect(result.partners).toHaveLength(2);
    });

    it('should handle error gracefully', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Stats error'));

      const result = await getResidencyStats([]);

      expect(log.error).toHaveBeenCalledWith('Error fetching residency partners:', expect.any(Error));
      expect(result.totalProfiles).toBe(0);
      expect(result.partners).toEqual([]);
    });
  });

  describe('getAvailablePhases', () => {
    it('should return R1-R4 for BSc', () => {
      expect(getAvailablePhases(false)).toEqual(['R1', 'R2', 'R3', 'R4']);
    });

    it('should return R1-R5 for MSc', () => {
      expect(getAvailablePhases(true)).toEqual(['R1', 'R2', 'R3', 'R4', 'R5']);
    });
  });
});
