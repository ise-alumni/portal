import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
  getTags,
  getEventById,
  deleteEvent,
  getEventsByUserId,
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
  organiser_profile_id: null,
  created_by: 'user-1',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  image_url: null,
  event_tags: [],
  organiser: undefined,
  ...overrides
})

describe('Events Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEvents', () => {
    it('should fetch events successfully', async () => {
      const mockEvents = [
        createTestEvent({ title: 'React Workshop' }),
        createTestEvent({ title: 'Networking Event', id: '2' })
      ]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockEvents,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEvents()

      expect(mockedSupabase.from).toHaveBeenCalledWith('events')
      expect(mockSelect).toHaveBeenCalled()
      expect(mockOrder).toHaveBeenCalledWith('start_at', { ascending: true })
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('React Workshop')
      expect(result[1].title).toBe('Networking Event')
    })

    it('should handle empty events list', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEvents()

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed')

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

    it('should use default image_url when not provided', async () => {
      const mockEvents = [createTestEvent({ image_url: null })]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockEvents,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEvents()

      expect(result[0].image_url).toBe('https://placehold.co/600x400')
    })

    it('should use custom image_url when provided', async () => {
      const mockEvents = [createTestEvent({ image_url: 'https://example.com/custom-image.jpg' })]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockEvents,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEvents()

      expect(result[0].image_url).toBe('https://example.com/custom-image.jpg')
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
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOrder).toHaveBeenCalledWith('name')
      expect(result).toEqual(mockTags)
    })

    it('should handle empty tags list', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getTags()

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Failed to fetch tags')

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

    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error')

      mockedSupabase.from.mockImplementation(() => {
        throw unexpectedError
      })

      const result = await getTags()

      expect(log.error).toHaveBeenCalledWith('Error in getTags:', unexpectedError)
      expect(result).toEqual([])
    })
  })

  describe('Event Status Helpers', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    describe('isEventInPast', () => {
      it('should return true for past events', () => {
        const pastEvent = createTestEvent({
          start_at: '2024-01-15T10:00:00Z',
          end_at: '2024-01-15T12:00:00Z'
        })

        vi.setSystemTime(new Date('2024-01-16T10:00:00Z'))

        expect(isEventInPast(pastEvent)).toBe(true)
      })

      it('should return false for future events', () => {
        const futureEvent = createTestEvent({
          start_at: '2024-01-20T10:00:00Z',
          end_at: '2024-01-20T12:00:00Z'
        })

        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

        expect(isEventInPast(futureEvent)).toBe(false)
      })

      it('should return false for ongoing events', () => {
        const ongoingEvent = createTestEvent({
          start_at: '2024-01-15T10:00:00Z',
          end_at: '2024-01-15T14:00:00Z'
        })

        vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

        expect(isEventInPast(ongoingEvent)).toBe(false)
      })

      it('should handle events without end time', () => {
        const eventWithoutEnd = createTestEvent({
          start_at: '2024-01-15T10:00:00Z',
          end_at: null
        })

        vi.setSystemTime(new Date('2024-01-16T10:00:00Z'))

        expect(isEventInPast(eventWithoutEnd)).toBe(true)
      })
    })

    describe('isEventUpcoming', () => {
      it('should return true for future events', () => {
        const futureEvent = createTestEvent({
          start_at: '2024-01-20T10:00:00Z',
          end_at: '2024-01-20T12:00:00Z'
        })

        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

        expect(isEventUpcoming(futureEvent)).toBe(true)
      })

      it('should return false for past events', () => {
        const pastEvent = createTestEvent({
          start_at: '2024-01-10T10:00:00Z',
          end_at: '2024-01-10T12:00:00Z'
        })

        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

        expect(isEventUpcoming(pastEvent)).toBe(false)
      })

      it('should return false for ongoing events', () => {
        const ongoingEvent = createTestEvent({
          start_at: '2024-01-15T08:00:00Z',
          end_at: '2024-01-15T14:00:00Z'
        })

        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

        expect(isEventUpcoming(ongoingEvent)).toBe(false)
      })
    })

    describe('isEventOngoing', () => {
      it('should return true for events currently in progress', () => {
        const ongoingEvent = createTestEvent({
          start_at: '2024-01-15T08:00:00Z',
          end_at: '2024-01-15T14:00:00Z'
        })

        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

        expect(isEventOngoing(ongoingEvent)).toBe(true)
      })

      it('should return false for events that have not started', () => {
        const futureEvent = createTestEvent({
          start_at: '2024-01-15T14:00:00Z',
          end_at: '2024-01-15T16:00:00Z'
        })

        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

        expect(isEventOngoing(futureEvent)).toBe(false)
      })

      it('should return false for events that have ended', () => {
        const pastEvent = createTestEvent({
          start_at: '2024-01-15T08:00:00Z',
          end_at: '2024-01-15T10:00:00Z'
        })

        vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

        expect(isEventOngoing(pastEvent)).toBe(false)
      })

      it('should handle events without end time', () => {
        const eventWithoutEnd = createTestEvent({
          start_at: '2024-01-15T08:00:00Z',
          end_at: null
        })

        vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

        expect(isEventOngoing(eventWithoutEnd)).toBe(true)
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

  describe('getEventById', () => {
    it('should fetch event by id successfully', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        description: 'Test description',
        start_at: '2024-02-15T10:00:00Z',
        end_at: '2024-02-15T12:00:00Z',
        location: 'Test Location',
        location_url: null,
        registration_url: null,
        organiser_profile_id: null,
        created_by: 'user-1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        image_url: null,
        organiser: null,
        event_tags: []
      }

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockEvent,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEventById('1')

      expect(mockedSupabase.from).toHaveBeenCalledWith('events')
      expect(result).toEqual({
        ...mockEvent,
        image_url: 'https://placehold.co/600x400',
        event_tags: []
      })
    })

    it('should return null when event not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEventById('non-existent')

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database error')
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEventById('1')

      expect(log.error).toHaveBeenCalledWith('Error fetching event by ID:', mockError)
      expect(result).toBeNull()
    })

    it('should handle unexpected errors', async () => {
      mockedSupabase.from.mockImplementation(() => {
        throw new Error('Network error')
      })

      const result = await getEventById('1')

      expect(log.error).toHaveBeenCalledWith('Error in getEventById:', expect.any(Error))
      expect(result).toBeNull()
    })
  })

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      const eventId = 'event-123'

      const mockEq = vi.fn().mockResolvedValue({ error: null })
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ delete: mockDelete })

      const result = await deleteEvent(eventId)

      expect(mockedSupabase.from).toHaveBeenCalledWith('events')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', eventId)
      expect(result).toBe(true)
    })

    it('should handle deletion errors', async () => {
      const eventId = 'event-123'
      const error = { message: 'Delete failed' }

      const mockEq = vi.fn().mockResolvedValue({ error })
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ delete: mockDelete })

      const result = await deleteEvent(eventId)

      expect(log.error).toHaveBeenCalledWith('Error deleting event:', error)
      expect(result).toBe(false)
    })

    it('should handle unexpected errors', async () => {
      const eventId = 'event-123'

      mockedSupabase.from.mockImplementation(() => {
        throw new Error('Network error')
      })

      const result = await deleteEvent(eventId)

      expect(log.error).toHaveBeenCalledWith('Error in deleteEvent:', expect.any(Error))
      expect(result).toBe(false)
    })
  })

  describe('getEventsByUserId', () => {
    it('should fetch events by user id successfully', async () => {
      const userId = 'user-123'
      const mockEvents = [
        createTestEvent({ id: '1', created_by: userId }),
        createTestEvent({ id: '2', created_by: userId })
      ]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockEvents,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEventsByUserId(userId)

      expect(mockedSupabase.from).toHaveBeenCalledWith('events')
      expect(mockEq).toHaveBeenCalledWith('created_by', userId)
      expect(result).toHaveLength(2)
    })

    it('should handle empty results', async () => {
      const userId = 'user-123'

      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEventsByUserId(userId)

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      const userId = 'user-123'
      const mockError = new Error('Database error')

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getEventsByUserId(userId)

      expect(log.error).toHaveBeenCalledWith('Error fetching events by user ID:', mockError)
      expect(result).toEqual([])
    })

    it('should handle unexpected errors', async () => {
      const userId = 'user-123'

      mockedSupabase.from.mockImplementation(() => {
        throw new Error('Network error')
      })

      const result = await getEventsByUserId(userId)

      expect(log.error).toHaveBeenCalledWith('Error in getEventsByUserId:', expect.any(Error))
      expect(result).toEqual([])
    })
  })
})