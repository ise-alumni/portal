/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn()
    },
    from: vi.fn()
  }
}))

vi.mock('@/lib/utils/logger', () => ({
  log: {
    error: vi.fn()
  }
}))

vi.mock('../profiles', () => ({
  getProfiles: vi.fn(),
  getUserActivity: vi.fn()
}))

const { supabase } = await import('@/integrations/supabase/client')
const { log } = await import('@/lib/utils/logger')
const { getProfiles, getUserActivity } = await import('../profiles')
const mockedSupabase = vi.mocked(supabase)

// Import domain functions after mocking
const {
  createUserWithProfile,
  removeUser,
  refreshUserData
} = await import('../admin')

describe('Admin domain functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:8080'
      },
      writable: true
    })
  })

  describe('createUserWithProfile', () => {
    it('should create user and profile successfully', async () => {
      const profileData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        graduationYear: '2020',
        userType: 'Alum' as const,
        msc: false
      }

      const mockProfileId = { id: 'profile-123' }

      // Mock auth signup
      mockedSupabase.auth.signUp = vi.fn().mockResolvedValue({
        error: null
      })

      // Mock profile fetch
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfileId,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      // Mock profile update
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })
      mockedSupabase.from.mockReturnValueOnce({ select: mockSelect }).mockReturnValueOnce({ update: mockUpdate })

      // Mock setTimeout to resolve immediately
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn((fn: () => void) => {
        fn()
        return 1 as any
      }) as any

      const result = await createUserWithProfile(profileData)

      global.setTimeout = originalSetTimeout

      expect(mockedSupabase.auth.signUp).toHaveBeenCalledWith({
        email: profileData.email,
        password: profileData.password,
        options: {
          emailRedirectTo: 'http://localhost:8080/',
          data: {
            full_name: profileData.fullName
          }
        }
      })
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should handle signup errors', async () => {
      const profileData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        userType: 'Alum' as const,
        msc: false
      }

      const signUpError = { message: 'Email already exists' }
      mockedSupabase.auth.signUp = vi.fn().mockResolvedValue({
        error: signUpError
      })

      const result = await createUserWithProfile(profileData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already exists')
      expect(log.error).toHaveBeenCalledWith('Error creating auth user:', signUpError)
    })

    it('should handle profile fetch errors', async () => {
      const profileData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        userType: 'Alum' as const,
        msc: false
      }

      mockedSupabase.auth.signUp = vi.fn().mockResolvedValue({
        error: null
      })

      const fetchError = { message: 'Profile not found' }
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: fetchError
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      // Mock setTimeout to resolve immediately
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn((fn: () => void) => {
        fn()
        return 1 as any
      }) as any

      const result = await createUserWithProfile(profileData)

      global.setTimeout = originalSetTimeout

      expect(result.success).toBe(false)
      expect(result.error).toContain('profile not found')
    })

    it('should handle profile update errors', async () => {
      const profileData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        userType: 'Alum' as const,
        msc: false
      }

      mockedSupabase.auth.signUp = vi.fn().mockResolvedValue({
        error: null
      })

      const mockProfileId = { id: 'profile-123' }
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfileId,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      const updateError = { message: 'Update failed' }
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: updateError })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

      mockedSupabase.from
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate })

      // Mock setTimeout to resolve immediately
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn((fn: () => void) => {
        fn()
        return 1 as any
      }) as any

      const result = await createUserWithProfile(profileData)

      global.setTimeout = originalSetTimeout

      expect(result.success).toBe(false)
      expect(result.error).toContain('Profile update failed')
    })

    it('should handle unexpected errors', async () => {
      const profileData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        userType: 'Alum' as const,
        msc: false
      }

      mockedSupabase.auth.signUp = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await createUserWithProfile(profileData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('removeUser', () => {
    it('should remove user successfully', async () => {
      const profileId = 'profile-123'

      const mockEq = vi.fn().mockResolvedValue({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ update: mockUpdate })

      const result = await removeUser(profileId)

      expect(mockedSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', profileId)
      expect(result).toBe(true)
    })

    it('should handle removal errors', async () => {
      const profileId = 'profile-123'
      const error = { message: 'Update failed' }

      const mockEq = vi.fn().mockResolvedValue({ error })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ update: mockUpdate })

      const result = await removeUser(profileId)

      expect(log.error).toHaveBeenCalledWith('Error removing user:', error)
      expect(result).toBe(false)
    })

    it('should handle unexpected errors', async () => {
      const profileId = 'profile-123'

      mockedSupabase.from.mockImplementation(() => {
        throw new Error('Network error')
      })

      const result = await removeUser(profileId)

      expect(log.error).toHaveBeenCalledWith('Error in removeUser:', expect.any(Error))
      expect(result).toBe(false)
    })
  })

  describe('refreshUserData', () => {
    it('should refresh user data successfully', async () => {
      const mockProfiles = [{ id: '1', full_name: 'Test User' }]
      const mockActivity = [{ id: '1', userId: '1', email: 'test@example.com' }]

      vi.mocked(getProfiles).mockResolvedValue(mockProfiles as any)
      vi.mocked(getUserActivity).mockResolvedValue(mockActivity as any)

      const result = await refreshUserData()

      expect(result.profiles).toEqual(mockProfiles)
      expect(result.userActivity).toEqual(mockActivity)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(getProfiles).mockRejectedValue(new Error('Fetch failed'))
      vi.mocked(getUserActivity).mockRejectedValue(new Error('Fetch failed'))

      const result = await refreshUserData()

      expect(log.error).toHaveBeenCalledWith('Error refreshing user data:', expect.any(Error))
      expect(result.profiles).toEqual([])
      expect(result.userActivity).toEqual([])
    })
  })
})

