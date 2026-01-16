import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase client before importing residency functions
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { 
  getResidencyPartners, 
  createResidencyPartner, 
  updateResidencyPartner, 
  deleteResidencyPartner, 
  getResidencyStats 
} from '../residency';
import { type Profile } from '@/lib/types/profiles';
import { type UserRole } from '@/lib/types/common';

describe('Residency Domain Functions', () => {
    const mockProfiles: Profile[] = [
      {
        id: '1',
        user_id: 'user1',
        full_name: 'John Doe',
        email: 'john@example.com',
        bio: 'Software Engineer',
        company: 'Tech Corp',
        city: 'New York',
        country: 'USA',
        cohort: 1,
        graduation_year: 2020,
        job_title: 'Software Engineer',
        avatar_url: null,
        is_public: true,
        msc: false,
        user_type: 'Alum' as UserRole,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        email_visible: true,
        linkedin_url: null,
        github_url: null,
        twitter_url: null,
        website_url: null,
      },
      {
        id: '2',
        user_id: 'user2',
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        bio: 'Product Manager',
        company: 'Google',
        city: 'San Francisco',
        country: 'USA',
        cohort: 2,
        graduation_year: 2021,
        job_title: 'Product Manager',
        avatar_url: null,
        is_public: true,
        msc: true,
        user_type: 'Alum' as UserRole,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        email_visible: true,
        linkedin_url: null,
        github_url: null,
        twitter_url: null,
        website_url: null,
      }
    ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getResidencyPartners', () => {
    it('should fetch residency partners successfully', async () => {
      const mockPartners = [
        { id: '1', name: 'Tech Corp', website: 'https://techcorp.com', logo_url: null, description: null, is_active: true },
        { id: '2', name: 'Google', website: 'https://google.com', logo_url: null, description: null, is_active: true }
      ];

      const mockFrom = vi.fn();
      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockOrder = vi.fn();

      mockFrom.mockReturnValue({
        select: mockSelect
      });
      
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      
      mockEq.mockReturnValue({
        order: mockOrder
      });
      
      mockOrder.mockResolvedValue({ data: mockPartners, error: null });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await getResidencyPartners();
      expect(result).toEqual(mockPartners);
    });

    it('should handle database errors gracefully', async () => {
      const mockFrom = vi.fn();
      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockOrder = vi.fn();

      mockFrom.mockReturnValue({
        select: mockSelect
      });
      
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      
      mockEq.mockReturnValue({
        order: mockOrder
      });
      
      mockOrder.mockResolvedValue({ data: null, error: new Error('Database error') });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await getResidencyPartners();
      expect(result).toEqual([]);
    });

    it('should handle empty data', async () => {
      const mockFrom = vi.fn();
      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockOrder = vi.fn();

      mockFrom.mockReturnValue({
        select: mockSelect
      });
      
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      
      mockEq.mockReturnValue({
        order: mockOrder
      });
      
      mockOrder.mockResolvedValue({ data: null, error: null });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await getResidencyPartners();
      expect(result).toEqual([]);
    });
  });

  describe('createResidencyPartner', () => {
    it('should create residency partner successfully', async () => {
      const newPartner = { name: 'New Partner', website: null, logo_url: null, description: null, is_active: true };
      const createdPartner = { id: '3', ...newPartner };

      const mockFrom = vi.fn();
      const mockInsert = vi.fn();
      const mockSelect = vi.fn();
      const mockSingle = vi.fn();

      mockFrom.mockReturnValue({
        insert: mockInsert
      });
      
      mockInsert.mockReturnValue({
        select: mockSelect
      });
      
      mockSelect.mockReturnValue({
        single: mockSingle
      });
      
      mockSingle.mockResolvedValue({ data: createdPartner, error: null });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await createResidencyPartner(newPartner);
      expect(result).toEqual(createdPartner);
    });

    it('should handle creation errors gracefully', async () => {
      const newPartner = { name: 'New Partner', website: null, logo_url: null, description: null, is_active: true };

      const mockFrom = vi.fn();
      const mockInsert = vi.fn();
      const mockSelect = vi.fn();
      const mockSingle = vi.fn();

      mockFrom.mockReturnValue({
        insert: mockInsert
      });
      
      mockInsert.mockReturnValue({
        select: mockSelect
      });
      
      mockSelect.mockReturnValue({
        single: mockSingle
      });
      
      mockSingle.mockResolvedValue({ data: null, error: new Error('Creation error') });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await createResidencyPartner(newPartner);
      expect(result).toBeNull();
    });
  });

  describe('updateResidencyPartner', () => {
    it('should update residency partner successfully', async () => {
      const updatedPartner = { id: '1', name: 'Updated Partner', website: null, logo_url: null, description: null, is_active: true };

      const mockFrom = vi.fn();
      const mockUpdate = vi.fn();
      const mockEq = vi.fn();
      const mockSelect = vi.fn();
      const mockSingle = vi.fn();

      mockFrom.mockReturnValue({
        update: mockUpdate
      });
      
      mockUpdate.mockReturnValue({
        eq: mockEq
      });
      
      mockEq.mockReturnValue({
        select: mockSelect
      });
      
      mockSelect.mockReturnValue({
        single: mockSingle
      });
      
      mockSingle.mockResolvedValue({ data: updatedPartner, error: null });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await updateResidencyPartner('1', { name: 'Updated Partner' });
      expect(result).toEqual(updatedPartner);
    });

    it('should handle update errors gracefully', async () => {
      const mockFrom = vi.fn();
      const mockUpdate = vi.fn();
      const mockEq = vi.fn();
      const mockSelect = vi.fn();
      const mockSingle = vi.fn();

      mockFrom.mockReturnValue({
        update: mockUpdate
      });
      
      mockUpdate.mockReturnValue({
        eq: mockEq
      });
      
      mockEq.mockReturnValue({
        select: mockSelect
      });
      
      mockSelect.mockReturnValue({
        single: mockSingle
      });
      
      mockSingle.mockResolvedValue({ data: null, error: new Error('Update error') });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await updateResidencyPartner('1', { name: 'Updated Partner' });
      expect(result).toBeNull();
    });
  });

  describe('deleteResidencyPartner', () => {
    it('should delete residency partner successfully', async () => {
      const mockFrom = vi.fn();
      const mockDelete = vi.fn();
      const mockEq = vi.fn();

      mockFrom.mockReturnValue({
        delete: mockDelete
      });
      
      mockDelete.mockReturnValue({
        eq: mockEq
      });
      
      mockEq.mockResolvedValue({ error: null });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await deleteResidencyPartner('1');
      expect(result).toBe(true);
    });

    it('should handle deletion errors gracefully', async () => {
      const mockFrom = vi.fn();
      const mockDelete = vi.fn();
      const mockEq = vi.fn();

      mockFrom.mockReturnValue({
        delete: mockDelete
      });
      
      mockDelete.mockReturnValue({
        eq: mockEq
      });
      
      mockEq.mockResolvedValue({ error: new Error('Deletion error') });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await deleteResidencyPartner('1');
      expect(result).toBe(false);
    });
  });

  describe('getResidencyStats', () => {
    it('should calculate residency stats correctly', async () => {
      const mockPartners = [
        { id: '1', name: 'Tech Corp', website: 'https://techcorp.com', logo_url: null, description: null, is_active: true },
        { id: '2', name: 'Google', website: 'https://google.com', logo_url: null, description: null, is_active: true }
      ];

      const mockFrom = vi.fn();
      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockOrder = vi.fn();

      mockFrom.mockReturnValue({
        select: mockSelect
      });
      
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      
      mockEq.mockReturnValue({
        order: mockOrder
      });
      
      mockOrder.mockResolvedValue({ data: mockPartners, error: null });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await getResidencyStats(mockProfiles);
      
      expect(result.totalProfiles).toBe(2);
      expect(result.atResidencyPartner).toBe(2);
      expect(result.notAtResidencyPartner).toBe(0);
      expect(result.residencyPercentage).toBe(100);
      expect(result.partners).toHaveLength(2);
    });

    it('should handle profiles not at residency partners', async () => {
      const mockPartners = [
        { id: '1', name: 'Tech Corp', website: 'https://techcorp.com', logo_url: null, description: null, is_active: true }
      ];

      const profilesNotAtPartners = [
        { ...mockProfiles[0], company: 'Other Company' },
        { ...mockProfiles[1], company: 'Another Company' }
      ];

      const mockFrom = vi.fn();
      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockOrder = vi.fn();

      mockFrom.mockReturnValue({
        select: mockSelect
      });
      
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      
      mockEq.mockReturnValue({
        order: mockOrder
      });
      
      mockOrder.mockResolvedValue({ data: mockPartners, error: null });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await getResidencyStats(profilesNotAtPartners);
      
      expect(result.totalProfiles).toBe(2);
      expect(result.atResidencyPartner).toBe(0);
      expect(result.notAtResidencyPartner).toBe(2);
      expect(result.residencyPercentage).toBe(0);
      expect(result.partners).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      const mockFrom = vi.fn();
      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockOrder = vi.fn();

      mockFrom.mockReturnValue({
        select: mockSelect
      });
      
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      
      mockEq.mockReturnValue({
        order: mockOrder
      });
      
      mockOrder.mockResolvedValue({ data: null, error: new Error('Stats error') });

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as unknown as { from: typeof mockFrom }).from = mockFrom;

      const result = await getResidencyStats(mockProfiles);
      
      expect(result.totalProfiles).toBe(2);
      expect(result.atResidencyPartner).toBe(0);
      expect(result.notAtResidencyPartner).toBe(2);
      expect(result.residencyPercentage).toBe(0);
      expect(result.partners).toEqual([]);
    });
  });
});