import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/integrations/supabase/client'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}))

vi.mock('@/lib/utils/images', () => ({
  getRandomAnnouncementImage: vi.fn(() => 'https://picsum.photos/seed/announcement123/400/200.jpg')
}))

vi.mock('@/lib/utils/logger', () => ({
  log: {
    error: vi.fn()
  }
}))

const mockedSupabase = vi.mocked(supabase)
const { log } = await import('@/lib/utils/logger')
const { getRandomAnnouncementImage } = await import('@/lib/utils/images')

// Import domain functions after mocking
const {
  getAnnouncements,
  getAnnouncementBySlug,
  isAnnouncementExpired,
  isAnnouncementActive,
  createAnnouncement
} = await import('../announcements')

describe('Announcements domain functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAnnouncements', () => {
    it('should fetch announcements successfully', async () => {
      const mockAnnouncements = [
        {
          id: '1',
          title: 'Test Announcement',
          content: 'Test content',
          type: 'opportunity' as const,
          external_url: null,
          deadline: null,
          image_url: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          created_by: 'user-123',
          slug: 'test-announcement'
        },
        {
          id: '2',
          title: 'Another Announcement',
          content: 'Another content',
          type: 'news' as const,
          external_url: null,
          deadline: null,
          image_url: null,
          created_at: '2024-01-14T10:00:00Z',
          updated_at: '2024-01-14T10:00:00Z',
          created_by: 'user-123',
          slug: 'another-announcement'
        }
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
        image_url: 'https://picsum.photos/seed/announcement123/400/200.jpg',
        type: 'opportunity'
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
        type: 'opportunity' as const,
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

      expect(getRandomAnnouncementImage).toHaveBeenCalled()
      expect(result[0].image_url).toBe('https://picsum.photos/seed/announcement123/400/200.jpg')
    })

    it('should preserve existing image_url when present', async () => {
      const mockAnnouncement = {
        id: '1',
        title: 'Test Announcement',
        content: 'Test content',
        type: 'opportunity' as const,
        image_url: 'https://example.com/custom-image.jpg',
        external_url: null,
        deadline: null,
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

      expect(getRandomAnnouncementImage).not.toHaveBeenCalled()
      expect(result[0].image_url).toBe('https://example.com/custom-image.jpg')
    })
  })

  describe('getAnnouncementBySlug', () => {
    it('should fetch announcement by slug successfully', async () => {
      const mockAnnouncement = {
        id: '1',
        title: 'Test Announcement',
        content: 'Test content',
        type: 'opportunity' as const,
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

      const result = await getAnnouncementBySlug('test-announcement')

      expect(mockedSupabase.from).toHaveBeenCalledWith('announcements')
      expect(result).toEqual({
        ...mockAnnouncement,
        image_url: 'https://picsum.photos/seed/announcement123/400/200.jpg',
        type: 'opportunity'
      })
    })

    it('should return null when announcement not found', async () => {
      const mockError = new Error('No rows found')

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getAnnouncementBySlug('non-existent')

      expect(log.error).toHaveBeenCalledWith('Error fetching announcement:', mockError)
      expect(result).toBeNull()
    })
  })

  describe('isAnnouncementExpired', () => {
    it('should return true for announcements with past deadline', () => {
      const announcement = {
        id: '1',
        title: 'Test',
        deadline: '2024-01-01T00:00:00Z'
      } as any

      // Mock current date to be after deadline
      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isAnnouncementExpired(announcement)).toBe(true)
    })

    it('should return false for announcements with future deadline', () => {
      const announcement = {
        id: '1',
        title: 'Test',
        deadline: '2024-12-31T23:59:59Z'
      } as any

      // Mock current date to be before deadline
      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isAnnouncementExpired(announcement)).toBe(false)
    })

    it('should return false for announcements without deadline', () => {
      const announcement = {
        id: '1',
        title: 'Test'
        // No deadline field
      } as any

      expect(isAnnouncementExpired(announcement)).toBe(false)
    })

    it('should handle edge case of current time exactly at deadline', () => {
      const announcement = {
        id: '1',
        title: 'Test',
        deadline: '2024-01-15T12:00:00Z'
      } as any

      // Mock current date to be exactly at deadline
      vi.setSystemTime(new Date('2024-01-15T12:00:01Z'))

      expect(isAnnouncementExpired(announcement)).toBe(true)
    })
  })

  describe('isAnnouncementActive', () => {
    it('should return true for non-expired announcements', () => {
      const announcement = {
        id: '1',
        title: 'Test',
        deadline: '2024-12-31T23:59:59Z'
      } as any

      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isAnnouncementActive(announcement)).toBe(true)
    })

    it('should return false for expired announcements', () => {
      const announcement = {
        id: '1',
        title: 'Test',
        deadline: '2024-01-01T00:00:00Z'
      } as any

      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isAnnouncementActive(announcement)).toBe(false)
    })

    it('should return true for announcements without deadline', () => {
      const announcement = {
        id: '1',
        title: 'Test'
        // No deadline field
      } as any

      expect(isAnnouncementActive(announcement)).toBe(true)
    })
  })

  describe('createAnnouncement', () => {
    it('should create announcement successfully', async () => {
      const newAnnouncement = {
        title: 'New Announcement',
        content: 'New content',
        type: 'opportunity' as const,
        external_url: null,
        deadline: null,
        image_url: null
      }

      const createdAnnouncement = {
        id: '1',
        ...newAnnouncement,
        created_by: 'user-123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        slug: 'new-announcement'
      }

      const mockSingle = vi.fn().mockResolvedValue({
        data: createdAnnouncement,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

      mockedSupabase.from.mockReturnValue({ insert: mockInsert })

      const result = await createAnnouncement(newAnnouncement, 'user-123')

      expect(mockedSupabase.from).toHaveBeenCalledWith('announcements')
      expect(result).toEqual({
        ...createdAnnouncement,
        image_url: 'https://picsum.photos/seed/announcement123/400/200.jpg',
        type: 'opportunity'
      })
    })

    it('should handle creation errors gracefully', async () => {
      const mockError = new Error('Creation failed')

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

      mockedSupabase.from.mockReturnValue({ insert: mockInsert })

      const result = await createAnnouncement({
        title: 'Test',
        content: 'Test',
        type: 'opportunity' as const,
        external_url: null,
        deadline: null,
        image_url: null
      }, 'user-123')

      expect(log.error).toHaveBeenCalledWith('Error creating announcement:', mockError)
      expect(result).toBeNull()
    })
  })
})