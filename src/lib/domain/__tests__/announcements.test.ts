import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import { type Announcement } from '@/lib/types'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}))

vi.mock('@/lib/utils/images', () => ({

}))

vi.mock('@/lib/utils/logger', () => ({
  log: {
    error: vi.fn()
  }
}))

const mockedSupabase = vi.mocked(supabase)
const { log } = await import('@/lib/utils/logger')


// Import domain functions after mocking
const {
  getAnnouncements,
  getAnnouncementById,
  isAnnouncementExpired,
  isAnnouncementActive,
  createAnnouncement
} = await import('../announcements')

// Test fixture for announcement
const createTestAnnouncement = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: '1',
  title: 'Test Announcement',
  content: 'Test content',
  external_url: null,
  deadline: null,
  image_url: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  created_by: 'user-1',
  organiser_profile_id: null,
  ...overrides
})

describe('Announcements domain functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAnnouncements', () => {
    it('should fetch announcements successfully', async () => {
  const mockAnnouncements = [
    createTestAnnouncement(),
    createTestAnnouncement({ 
      title: 'Another Announcement', 
      content: 'Another content'
    })
  ]

      // Create mock chain step by step
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockAnnouncements,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getAnnouncements()

      expect(mockedSupabase.from).toHaveBeenCalledWith('announcements')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
      ...mockAnnouncements[0],
      image_url: 'https://placehold.co/600x400',
      tags: []
      })
    })

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error')

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getAnnouncements()

      expect(log.error).toHaveBeenCalledWith('Error fetching announcements:', mockError)
      expect(result).toEqual([])
    })

    it('should handle empty data', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getAnnouncements()

      expect(result).toEqual([])
    })

    it('should add random image URL when image_url is missing', async () => {
      const mockAnnouncement = {
        id: '1',
        title: 'Test Announcement',
        content: 'Test content',
        external_url: null,
        deadline: null,
        image_url: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        created_by: 'user-123',
        slug: 'test-announcement'
      }

      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockAnnouncement],
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getAnnouncements()

      expect(result[0].image_url).toBe('https://placehold.co/600x400')
    })

    it('should preserve existing image_url when present', async () => {
      const mockAnnouncement = {
        id: '1',
        title: 'Test Announcement',
        content: 'Test content',
        image_url: 'https://example.com/custom-image.jpg',
        external_url: null,
        deadline: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        created_by: 'user-123'
      }

      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockAnnouncement],
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getAnnouncements()


      expect(result[0].image_url).toBe('https://example.com/custom-image.jpg')
    })
  })

  describe('getAnnouncementById', () => {
    it('should fetch announcement by id successfully', async () => {
      const mockAnnouncement = {
        id: '1',
        title: 'Test Announcement',
        content: 'Test content',
        external_url: null,
        deadline: null,
        image_url: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        created_by: 'user-123',
        slug: 'test-announcement'
      }

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockAnnouncement,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getAnnouncementById('1')

      expect(mockedSupabase.from).toHaveBeenCalledWith('announcements')
      expect(result).toEqual({
        ...mockAnnouncement,
        image_url: 'https://placehold.co/600x400',
        tags: []
      })
    })

    it('should return null when announcement not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getAnnouncementById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('isAnnouncementExpired', () => {
    it('should return true for announcements with past deadline', () => {
      const announcement = createTestAnnouncement({
        deadline: '2024-01-01T00:00:00Z'
      })

      // Mock current date to be after deadline
      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isAnnouncementExpired(announcement)).toBe(true)
    })

    it('should return false for announcements with future deadline', () => {
      const announcement = createTestAnnouncement({
        deadline: '2024-12-31T23:59:59Z'
      })

      // Mock current date to be before deadline
      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isAnnouncementExpired(announcement)).toBe(false)
    })

    it('should return false for announcements without deadline', () => {
      const announcement = createTestAnnouncement({
        deadline: undefined
      })

      expect(isAnnouncementExpired(announcement)).toBe(false)
    })

    it('should handle edge case of current time exactly at deadline', () => {
      const announcement = createTestAnnouncement({
        deadline: '2024-01-15T12:00:00Z'
      })

      // Mock current date to be exactly at deadline
      vi.setSystemTime(new Date('2024-01-15T12:00:01Z'))

      expect(isAnnouncementExpired(announcement)).toBe(true)
    })
  })

  describe('isAnnouncementActive', () => {
    it('should return true for non-expired announcements', () => {
      const announcement = createTestAnnouncement({
        deadline: '2024-12-31T23:59:59Z'
      })

      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isAnnouncementActive(announcement)).toBe(true)
    })

    it('should return false for expired announcements', () => {
      const announcement = createTestAnnouncement({
        deadline: '2024-01-01T00:00:00Z'
      })

      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isAnnouncementActive(announcement)).toBe(false)
    })

    it('should return true for announcements without deadline', () => {
      const announcement = createTestAnnouncement({
        deadline: undefined
      })

      expect(isAnnouncementActive(announcement)).toBe(true)
    })
  })

  describe('createAnnouncement', () => {
    it('should create announcement successfully', async () => {
      const newAnnouncement = {
        title: 'New Announcement',
        content: 'New content',
        external_url: null,
        deadline: null,
        image_url: null,
        organiser_profile_id: null
      }

      const userProfile = {
        id: 'profile-123'
      }

      const createdAnnouncement = {
        id: '1',
        ...newAnnouncement,
        created_by: 'user-123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }

      // Mock profile lookup
      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: userProfile,
        error: null
      })
      const mockProfileEq = vi.fn().mockReturnValue({ single: mockProfileSingle })
      const mockProfileSelect = vi.fn().mockReturnValue({ eq: mockProfileEq })

      // Mock announcement creation
      const mockAnnouncementSingle = vi.fn().mockResolvedValue({
        data: createdAnnouncement,
        error: null
      })
      const mockAnnouncementSelect = vi.fn().mockReturnValue({ single: mockAnnouncementSingle })
      const mockAnnouncementInsert = vi.fn().mockReturnValue({ select: mockAnnouncementSelect })

      // Set up mock chain for both calls
      mockedSupabase.from
        .mockReturnValueOnce({ select: mockProfileSelect }) // First call: profiles
        .mockReturnValueOnce({ insert: mockAnnouncementInsert }) // Second call: announcements

      const result = await createAnnouncement(newAnnouncement, 'user-123')

      expect(mockedSupabase.from).toHaveBeenNthCalledWith(1, 'profiles')
      expect(mockedSupabase.from).toHaveBeenNthCalledWith(2, 'announcements')
      const expectedResult: Announcement = {
        id: '1',
        title: 'New Announcement',
        content: 'New content',
        external_url: null,
        deadline: null,
        image_url: 'https://placehold.co/600x400',
        created_by: 'user-123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        organiser_profile_id: null,
        organiser: undefined,
        tags: []
      }
      
      expect(result).toEqual(expectedResult)
    })

    it('should handle creation errors gracefully', async () => {
      const mockError = new Error('Creation failed')

      // Mock profile lookup
      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: { id: 'profile-123' },
        error: null
      })
      const mockProfileEq = vi.fn().mockReturnValue({ single: mockProfileSingle })
      const mockProfileSelect = vi.fn().mockReturnValue({ eq: mockProfileEq })

      // Mock announcement creation error
      const mockAnnouncementSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockAnnouncementSelect = vi.fn().mockReturnValue({ single: mockAnnouncementSingle })
      const mockAnnouncementInsert = vi.fn().mockReturnValue({ select: mockAnnouncementSelect })

      // Set up mock chain for both calls
      mockedSupabase.from
        .mockReturnValueOnce({ select: mockProfileSelect }) // First call: profiles
        .mockReturnValueOnce({ insert: mockAnnouncementInsert }) // Second call: announcements

      const result = await createAnnouncement({
        title: 'Test',
        content: 'Test',
        external_url: null,
        deadline: null,
        image_url: null,
        organiser_profile_id: null,
        tag_ids: []
      }, 'user-123')

      expect(log.error).toHaveBeenCalledWith('Error creating announcement:', mockError)
      expect(result).toBeNull()
    })
  })
})