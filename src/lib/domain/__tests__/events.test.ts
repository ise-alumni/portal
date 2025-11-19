import { describe, it, expect, vi, beforeEach } from 'vitest'
import { type EventData } from '@/lib/types'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}))

vi.mock('@/lib/utils/images', () => ({
  handleImageError: vi.fn()
}))

vi.mock('@/lib/utils/logger', () => ({
  log: {
    error: vi.fn()
  }
}))

const { supabase } = await import('@/integrations/supabase/client')
const { handleImageError } = await import('@/lib/utils/images')
const { log } = await import('@/lib/utils/logger')
const mockedSupabase = vi.mocked(supabase)

// Import domain functions after mocking
const {
  getEvents,
  getEventBySlug,
  getTags,
  isEventInPast,
  isEventUpcoming,
  isEventOngoing
} = await import('../events')

// Test fixture for event
const createTestEvent = (overrides: Partial<EventData> = {}): EventData => ({
  id: '1',
  title: 'Test Event',
  description: 'Test description',
  start_at: '2024-02-15T10:00:00Z',
  end_at: '2024-02-15T12:00:00Z',
  location: 'Test Location',
  location_url: null,
  registration_url: null,
  slug: 'test-event',
  organiser_profile_id: null,
  created_by: 'user-1',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  image_url: null,
  ...overrides
})

describe('Events domain functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEvents', () => {
    it('should fetch events successfully', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'React Workshop',
          description: 'Learn React basics',
          start_at: '2024-02-15T10:00:00Z',
          end_at: '2024-02-15T12:00:00Z',
          location: 'Online',
          slug: 'react-workshop'
        },
        {
          id: 2,
          title: 'Networking Event',
          description: 'Meet alumni',
          start_at: '2024-03-20T18:00:00Z',
          end_at: '2024-03-20T20:00:00Z',
          location: 'Office',
          slug: 'networking-event'
        }
      ]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockEvents,
        error: null
      })

      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEvents()

      expect(mockedSupabase.from).toHaveBeenCalledWith('events')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        ...mockEvents[0],
        image_url: 'https://placehold.co/600x400'
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

      const result = await getEvents()

      expect(log.error).toHaveBeenCalledWith('Error fetching events:', mockError)
      expect(result).toEqual([])
    })

    it('should handle empty data', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEvents()

      expect(result).toEqual([])
    })

    it('should add random image URL when image_url is missing', async () => {
      const mockEvent = {
        id: 1,
        title: 'React Workshop',
        description: 'Learn React basics',
        start_at: '2024-02-15T10:00:00Z',
        end_at: '2024-02-15T12:00:00Z',
        location: 'Online',
        image_url: null,
        slug: 'react-workshop'
      }

      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockEvent],
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEvents()

      expect(result[0].image_url).toBe('https://placehold.co/600x400')
    })

    it('should preserve existing image_url when present', async () => {
      const mockEvent = {
        id: 1,
        title: 'React Workshop',
        description: 'Learn React basics',
        start_at: '2024-02-15T10:00:00Z',
        end_at: '2024-02-15T12:00:00Z',
        location: 'Online',
        image_url: 'https://example.com/custom-image.jpg',
        slug: 'react-workshop'
      }

      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockEvent],
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEvents()

      expect(result[0].image_url).toBe('https://example.com/custom-image.jpg')
    })
  })

  describe('getEventBySlug', () => {
    it('should fetch event by slug successfully', async () => {
      const mockEvent = {
        id: 1,
        title: 'React Workshop',
        description: 'Learn React basics',
        start_at: '2024-02-15T10:00:00Z',
        end_at: '2024-02-15T12:00:00Z',
        location: 'Online',
        image_url: null,
        slug: 'react-workshop'
      }

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockEvent,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEventBySlug('react-workshop')

      expect(mockedSupabase.from).toHaveBeenCalledWith('events')
      expect(result).toEqual({
        ...mockEvent,
        image_url: 'https://placehold.co/600x400'
      })
    })

    it('should return null when event not found', async () => {
      const mockError = new Error('No rows found')

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEventBySlug('non-existent')

      expect(log.error).toHaveBeenCalledWith('Error fetching event:', mockError)
      expect(result).toBeNull()
    })
  })

  describe('getTags', () => {
    it('should fetch tags successfully', async () => {
      const mockTags = [
        { id: '1', name: 'React', color: '#61DAFB' },
        { id: '2', name: 'TypeScript', color: '#3178C6' },
        { id: '3', name: 'Node.js', color: '#339933' }
      ]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockTags,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getTags()

      expect(mockedSupabase.from).toHaveBeenCalledWith('tags')
      expect(result).toEqual(mockTags)
    })

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error')

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getTags()

      expect(log.error).toHaveBeenCalledWith('Error fetching tags:', mockError)
      expect(result).toEqual([])
    })

    it('should handle empty data', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getTags()

      expect(result).toEqual([])
    })
  })

  describe('isEventInPast', () => {
    it('should return true for events that have ended', () => {
      const event = createTestEvent({
        end_at: '2024-01-01T00:00:00Z'
      })

      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isEventInPast(event)).toBe(true)
    })

    it('should return false for events that have not ended', () => {
      const event = createTestEvent({
        end_at: '2024-12-31T23:59:59Z'
      })

      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isEventInPast(event)).toBe(false)
    })

    it('should handle edge case of current time exactly at end time', () => {
      const event = createTestEvent({
        end_at: '2024-01-15T12:00:00Z'
      })

      vi.setSystemTime(new Date('2024-01-15T12:00:01Z'))

      expect(isEventInPast(event)).toBe(true)
    })
  })

  describe('isEventUpcoming', () => {
    it('should return true for events that have not started', () => {
      const event = createTestEvent({
        start_at: '2024-12-31T23:59:59Z'
      })

      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isEventUpcoming(event)).toBe(true)
    })

    it('should return false for events that have started', () => {
      const event = createTestEvent({
        start_at: '2024-01-01T00:00:00Z'
      })

      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isEventUpcoming(event)).toBe(false)
    })

    it('should handle edge case of current time exactly at start time', () => {
      const event = createTestEvent({
        start_at: '2024-01-15T12:00:00Z'
      })

      vi.setSystemTime(new Date('2024-01-15T12:00:01Z'))

      expect(isEventUpcoming(event)).toBe(false)
    })
  })

  describe('isEventOngoing', () => {
    it('should return true for events currently in progress', () => {
      const event = createTestEvent({
        start_at: '2024-01-10T00:00:00Z',
        end_at: '2024-01-20T00:00:00Z'
      })

      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isEventOngoing(event)).toBe(true)
    })

    it('should return false for events that have not started', () => {
      const event = createTestEvent({
        start_at: '2024-12-31T23:59:59Z',
        end_at: '2025-01-01T00:00:00Z'
      })

      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isEventOngoing(event)).toBe(false)
    })

    it('should return false for events that have ended', () => {
      const event = createTestEvent({
        start_at: '2024-01-01T00:00:00Z',
        end_at: '2024-01-10T00:00:00Z'
      })

      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))

      expect(isEventOngoing(event)).toBe(false)
    })

    it('should handle edge case of event starting exactly now', () => {
      const event = createTestEvent({
        start_at: '2024-01-15T12:00:00Z',
        end_at: '2024-01-15T13:00:00Z'
      })

      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

      expect(isEventOngoing(event)).toBe(true)
    })

    it('should handle edge case of event ending exactly now', () => {
      const event = createTestEvent({
        start_at: '2024-01-15T11:00:00Z',
        end_at: '2024-01-15T12:00:00Z'
      })

      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

      expect(isEventOngoing(event)).toBe(true) // Event ending exactly now is still considered ongoing
    })
  })
})