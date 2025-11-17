import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import { log } from '@/lib/utils/logger'

// Mock the supabase client and logger
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}))

vi.mock('@/lib/utils/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn()
  }
}))

const mockedSupabase = vi.mocked(supabase)
const mockedLog = vi.mocked(log)

describe('Constants functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module cache by clearing require cache
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getUserTypes', () => {
    it('should fetch user types from database successfully', async () => {
      const mockData = [
        { user_type: 'Admin' },
        { user_type: 'Staff' },
        { user_type: 'Alum' },
        { user_type: 'Admin' } // Duplicate to test uniqueness
      ]
      const mockSelect = vi.fn().mockReturnValue({
        data: mockData,
        error: null
      })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      // Import after mocking to ensure fresh module
      const { getUserTypes } = await import('../index')
      const result = await getUserTypes()

      expect(mockedSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSelect).toHaveBeenCalledWith('user_type')
      expect(result).toEqual(['Admin', 'Staff', 'Alum'])
    })

    it('should return fallback types when database returns empty', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        data: [],
        error: null
      })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const { getUserTypes } = await import('../index')
      const result = await getUserTypes()

      expect(result).toEqual(['Admin', 'Staff', 'Alum'])
    })

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error')
      const mockNot = vi.fn().mockReturnValue({
        data: null,
        error: mockError
      })
      const mockSelect = vi.fn().mockReturnValue({ not: mockNot })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const { getUserTypes } = await import('../index')
      const result = await getUserTypes()

      expect(mockedLog.error).toHaveBeenCalledWith('Error fetching user types:', mockError)
      expect(result).toEqual(['Admin', 'Staff', 'Alum'])
    })

    it('should handle null data gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        data: null,
        error: null
      })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const { getUserTypes } = await import('../index')
      const result = await getUserTypes()

      expect(result).toEqual(['Admin', 'Staff', 'Alum'])
    })
  })

  describe('getAnnouncementTypes', () => {
    it('should fetch announcement types from database successfully', async () => {
      const mockData = [
        { type: 'opportunity' },
        { type: 'news' },
        { type: 'lecture' },
        { type: 'program' },
        { type: 'opportunity' } // Duplicate to test uniqueness
      ]
      const mockNot = vi.fn().mockReturnValue({
        data: mockData,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ not: mockNot })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const { getAnnouncementTypes } = await import('../index')
      const result = await getAnnouncementTypes()

      expect(mockedSupabase.from).toHaveBeenCalledWith('announcements')
      expect(mockSelect).toHaveBeenCalledWith('type')
      expect(result).toEqual(['opportunity', 'news', 'lecture', 'program'])
    })

    it('should return fallback types when database returns empty', async () => {
      const mockNot = vi.fn().mockReturnValue({
        data: [],
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ not: mockNot })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const { getAnnouncementTypes } = await import('../index')
      const result = await getAnnouncementTypes()

      expect(result).toEqual(['opportunity', 'news', 'lecture', 'program'])
    })

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error')
      const mockNot = vi.fn().mockReturnValue({
        data: null,
        error: mockError
      })
      const mockSelect = vi.fn().mockReturnValue({ not: mockNot })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const { getAnnouncementTypes } = await import('../index')
      const result = await getAnnouncementTypes()

      expect(mockedLog.error).toHaveBeenCalledWith('Error fetching announcement types:', mockError)
      expect(result).toEqual(['opportunity', 'news', 'lecture', 'program'])
    })
  })

  describe('getEventTags', () => {
    it('should fetch event tags from database successfully', async () => {
      const mockData = [
        { name: 'Networking', color: '#10b981' },
        { name: 'Workshop', color: '#f59e0b' }
      ]
      const mockOrder = vi.fn().mockReturnValue({
        data: mockData,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const { getEventTags } = await import('../index')
      const result = await getEventTags()

      expect(mockedSupabase.from).toHaveBeenCalledWith('tags')
      expect(mockSelect).toHaveBeenCalledWith('name, color')
      expect(mockOrder).toHaveBeenCalledWith('name')
      expect(result).toEqual(mockData)
    })

    it('should return empty array when database returns empty (no error)', async () => {
      const mockOrder = vi.fn().mockReturnValue({
        data: [],
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const { getEventTags } = await import('../index')
      const result = await getEventTags()

      expect(result).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error')
      const mockOrder = vi.fn().mockReturnValue({
        data: null,
        error: mockError
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const { getEventTags } = await import('../index')
      const result = await getEventTags()

      expect(mockedLog.error).toHaveBeenCalledWith('Error fetching event tags:', mockError)
      expect(result).toEqual([
        { name: 'Networking', color: '#10b981' },
        { name: 'Workshop', color: '#f59e0b' },
        { name: 'Social', color: '#ef4444' },
        { name: 'Career', color: '#8b5cf6' },
        { name: 'Technical', color: '#06b6d4' },
        { name: 'Alumni', color: '#84cc16' },
        { name: 'Online', color: '#6366f1' },
        { name: 'In-Person', color: '#f97316' }
      ])
    })

    it('should handle null data gracefully', async () => {
      const mockOrder = vi.fn().mockReturnValue({
        data: null,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const { getEventTags } = await import('../index')
      const result = await getEventTags()

      expect(result).toEqual([])
    })
  })

  describe('initializeConstants', () => {
    it('should initialize all constants successfully', async () => {
      // Mock successful responses for all three functions
      const mockUserSelect = vi.fn().mockReturnValue({
        data: [{ user_type: 'Admin' }, { user_type: 'Staff' }],
        error: null
      })
      const mockAnnouncementSelect = vi.fn().mockReturnValue({
        data: [{ type: 'opportunity' }, { type: 'news' }],
        error: null
      })
      const mockEventOrder = vi.fn().mockReturnValue({
        data: [{ name: 'Networking', color: '#10b981' }],
        error: null
      })
      const mockEventSelect = vi.fn().mockReturnValue({ order: mockEventOrder })

      // Set up the mock to return different responses based on table name
      mockedSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return { select: mockUserSelect }
        if (table === 'announcements') return { select: mockAnnouncementSelect }
        if (table === 'tags') return { select: mockEventSelect }
        return { select: vi.fn() }
      })

      const { initializeConstants } = await import('../index')
      await initializeConstants()

      expect(mockedLog.info).toHaveBeenCalledWith('Constants initialized from database')
    })

    it('should handle initialization errors gracefully', async () => {
      const mockError = new Error('Initialization failed')
      const mockNot = vi.fn().mockReturnValue({
        data: null,
        error: mockError
      })
      const mockOrder = vi.fn().mockReturnValue({
        data: null,
        error: mockError
      })
      const mockSelect = vi.fn().mockImplementation((query: string) => {
        if (query === 'name, color') return { order: mockOrder }
        return { not: mockNot }
      })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const { initializeConstants } = await import('../index')
      await initializeConstants()

      // Should log errors for each failed fetch
      expect(mockedLog.error).toHaveBeenCalledWith('Error fetching user types:', mockError)
      expect(mockedLog.error).toHaveBeenCalledWith('Error fetching announcement types:', mockError)
      expect(mockedLog.error).toHaveBeenCalledWith('Error fetching event tags:', mockError)
    })
  })

  describe('Synchronous getters', () => {
    it('should return empty array when cache is not initialized', async () => {
      const constants = await import('../index')
      const { getUserTypesSync, getAnnouncementTypesSync, getEventTagsSync } = constants

      expect(getUserTypesSync()).toEqual([])
      expect(getAnnouncementTypesSync()).toEqual([])
      expect(getEventTagsSync()).toEqual([
        { name: 'Networking', color: '#10b981' },
        { name: 'Workshop', color: '#f59e0b' },
        { name: 'Social', color: '#ef4444' },
        { name: 'Career', color: '#8b5cf6' },
        { name: 'Technical', color: '#06b6d4' },
        { name: 'Alumni', color: '#84cc16' },
        { name: 'Online', color: '#6366f1' },
        { name: 'In-Person', color: '#f97316' }
      ])
    })
  })

  describe('Validation functions', () => {
    beforeEach(async () => {
      // Initialize cache with test data
      const mockUserNot = vi.fn().mockReturnValue({
        data: [{ user_type: 'Admin' }, { user_type: 'Staff' }, { user_type: 'Alum' }],
        error: null
      })
      const mockUserSelect = vi.fn().mockReturnValue({ not: mockUserNot })
      
      const mockAnnouncementNot = vi.fn().mockReturnValue({
        data: [{ type: 'opportunity' }, { type: 'news' }, { type: 'lecture' }],
        error: null
      })
      const mockAnnouncementSelect = vi.fn().mockReturnValue({ not: mockAnnouncementNot })
      
      const mockEventOrder = vi.fn().mockReturnValue({
        data: [
          { name: 'Networking', color: '#10b981' },
          { name: 'Workshop', color: '#f59e0b' }
        ],
        error: null
      })
      const mockEventSelect = vi.fn().mockReturnValue({ order: mockEventOrder })

      mockedSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return { select: mockUserSelect }
        if (table === 'announcements') return { select: mockAnnouncementSelect }
        if (table === 'tags') return { select: mockEventSelect }
        return { select: vi.fn() }
      })

      const { initializeConstants } = await import('../index')
      await initializeConstants()
    })

    it('should validate user types correctly', async () => {
      const constants = await import('../index')
      const { isValidUserType } = constants

      expect(isValidUserType('Admin')).toBe(true)
      expect(isValidUserType('Staff')).toBe(true)
      expect(isValidUserType('Alum')).toBe(true)
      expect(isValidUserType('Invalid')).toBe(false)
    })

    it('should validate announcement types correctly', async () => {
      const constants = await import('../index')
      const { isValidAnnouncementType } = constants

      expect(isValidAnnouncementType('opportunity')).toBe(true)
      expect(isValidAnnouncementType('news')).toBe(true)
      expect(isValidAnnouncementType('lecture')).toBe(true)
      expect(isValidAnnouncementType('invalid')).toBe(false)
    })

    it('should validate event tags correctly', async () => {
      const constants = await import('../index')
      const { isValidEventTag } = constants

      expect(isValidEventTag('Networking')).toBe(true)
      expect(isValidEventTag('Workshop')).toBe(true)
      expect(isValidEventTag('Invalid')).toBe(false)
    })

    it('should get event tag color correctly', async () => {
      const constants = await import('../index')
      const { getEventTagColor } = constants

      expect(getEventTagColor('Networking')).toBe('#10b981')
      expect(getEventTagColor('Workshop')).toBe('#f59e0b')
      expect(getEventTagColor('Unknown')).toBe('#3b82f6') // Default color
    })

    it('should check content creation permissions correctly', async () => {
      const constants = await import('../index')
      const { canUserCreateContent } = constants

      expect(canUserCreateContent('Admin')).toBe(true)
      expect(canUserCreateContent('Staff')).toBe(true)
      expect(canUserCreateContent('Alum')).toBe(false)
      expect(canUserCreateContent(null)).toBe(false)
    })

    it('should check admin permissions correctly', async () => {
      const constants = await import('../index')
      const { isAdmin } = constants

      expect(isAdmin('Admin')).toBe(true)
      expect(isAdmin('Staff')).toBe(true)
      expect(isAdmin('Alum')).toBe(false)
      expect(isAdmin(null)).toBe(false)
    })
  })

  describe('Option generators', () => {
    beforeEach(async () => {
      // Initialize cache with test data
      const mockUserNot = vi.fn().mockReturnValue({
        data: [{ user_type: 'Admin' }, { user_type: 'Staff' }, { user_type: 'Alum' }],
        error: null
      })
      const mockUserSelect = vi.fn().mockReturnValue({ not: mockUserNot })
      
      const mockAnnouncementNot = vi.fn().mockReturnValue({
        data: [{ type: 'opportunity' }, { type: 'news' }, { type: 'lecture' }, { type: 'program' }],
        error: null
      })
      const mockAnnouncementSelect = vi.fn().mockReturnValue({ not: mockAnnouncementNot })
      
      const mockEventOrder = vi.fn().mockReturnValue({
        data: [
          { name: 'Networking', color: '#10b981' },
          { name: 'Workshop', color: '#f59e0b' }
        ],
        error: null
      })
      const mockEventSelect = vi.fn().mockReturnValue({ order: mockEventOrder })

      mockedSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return { select: mockUserSelect }
        if (table === 'announcements') return { select: mockAnnouncementSelect }
        if (table === 'tags') return { select: mockEventSelect }
        return { select: vi.fn() }
      })

      const { initializeConstants } = await import('../index')
      await initializeConstants()
    })

    it('should generate user type options correctly', async () => {
      const constants = await import('../index')
      const { getUserTypeOptions } = constants

      const options = getUserTypeOptions()
      expect(options).toEqual([
        { value: 'Admin', label: 'Admin' },
        { value: 'Staff', label: 'Staff' },
        { value: 'Alum', label: 'Alum' }
      ])
    })

    it('should generate announcement type options correctly', async () => {
      const constants = await import('../index')
      const { getAnnouncementTypeOptions } = constants

      const options = getAnnouncementTypeOptions()
      expect(options).toEqual([
        { value: 'opportunity', label: 'Opportunity' },
        { value: 'news', label: 'News' },
        { value: 'lecture', label: 'Lecture' },
        { value: 'program', label: 'Program' }
      ])
    })

    it('should generate event tag options correctly', async () => {
      const constants = await import('../index')
      const { getEventTagOptions } = constants

      const options = getEventTagOptions()
      expect(options).toEqual([
        { value: 'Networking', label: 'Networking', color: '#10b981' },
        { value: 'Workshop', label: 'Workshop', color: '#f59e0b' }
      ])
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle empty arrays in validation functions', async () => {
      // Mock empty responses
      const mockNot = vi.fn().mockReturnValue({
        data: [],
        error: null
      })
      const mockOrder = vi.fn().mockReturnValue({
        data: [],
        error: null
      })
      const mockSelect = vi.fn().mockImplementation((query: string) => {
        if (query === 'name, color') return { order: mockOrder }
        return { not: mockNot }
      })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const constants = await import('../index')
      const { initializeConstants, isValidUserType, isValidAnnouncementType, isValidEventTag } = constants
      await initializeConstants()

      expect(isValidUserType('Admin')).toBe(true) // Fallback values should be used
      expect(isValidAnnouncementType('opportunity')).toBe(true) // Fallback values should be used
      expect(isValidEventTag('Networking')).toBe(false) // Cache set to empty array, no fallback
    })

    it('should handle malformed data in cache', async () => {
      // Mock malformed data
      const mockUserSelect = vi.fn().mockReturnValue({
        data: [{ user_type: null }, { user_type: undefined }, { user_type: 'Admin' }],
        error: null
      })
      const mockAnnouncementSelect = vi.fn().mockReturnValue({
        data: [{ type: '' }, { type: 'opportunity' }],
        error: null
      })
      const mockEventOrder = vi.fn().mockReturnValue({
        data: [{ name: 'Workshop', color: '#f59e0b' }],
        error: null
      })
      const mockEventSelect = vi.fn().mockReturnValue({ order: mockEventOrder })

      mockedSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return { select: mockUserSelect }
        if (table === 'announcements') return { select: mockAnnouncementSelect }
        if (table === 'tags') return { select: mockEventSelect }
        return { select: vi.fn() }
      })

      const constants = await import('../index')
      const { initializeConstants, isValidUserType, isValidAnnouncementType, isValidEventTag, getEventTagColor } = constants
      await initializeConstants()

      expect(isValidUserType(null)).toBe(false)
      expect(isValidAnnouncementType(null)).toBe(false)
      expect(isValidEventTag(null)).toBe(false)
      expect(isValidEventTag('Workshop')).toBe(true)
      expect(getEventTagColor('Workshop')).toBe('#f59e0b')
      expect(getEventTagColor('Unknown')).toBe('#3b82f6')
    })
  })
})