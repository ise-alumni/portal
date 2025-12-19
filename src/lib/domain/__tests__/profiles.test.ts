/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UserRole } from '@/lib/types/common'
import { createMockProfile } from './test-helpers'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}))

vi.mock('@/lib/utils/logger', () => ({
  log: {
    error: vi.fn()
  }
}))

const { supabase } = await import('@/integrations/supabase/client')
const { log } = await import('@/lib/utils/logger')
const mockedSupabase = vi.mocked(supabase)

// Import domain functions after mocking
const {
  getProfiles,
  getProfileByUserId,
  getProfileById,
  uploadAvatar,
  calculateProfileCompletionPercentage,
  updateProfile,
  searchProfiles,
  isProfileComplete
} = await import('../profiles')

describe('Profiles domain functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProfiles', () => {
    it('should fetch profiles successfully', async () => {
      const mockProfiles = [createMockProfile()]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockProfiles,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getProfiles()

      expect(mockedSupabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockProfiles[0])
    })

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error')

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getProfiles()

      expect(log.error).toHaveBeenCalledWith('Error fetching profiles:', mockError)
      expect(result).toEqual([])
    })

    it('should handle empty data', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getProfiles()

      expect(result).toEqual([])
    })
  })

  describe('getProfileByUserId', () => {
    it('should fetch profile by user ID successfully', async () => {
      const mockProfile = createMockProfile()

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      })
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getProfileByUserId('1')

      expect(mockedSupabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toEqual(mockProfile)
    })

    it('should return null when profile not found', async () => {
      const mockError = new Error('No rows found')

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getProfileByUserId('non-existent')

      expect(log.error).toHaveBeenCalledWith('Error fetching profile by user ID:', mockError)
      expect(result).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const userId = '1'
      const formData = {
        fullName: 'John Updated',
        city: 'New York',
        country: 'USA',
        graduationYear: '2020',
        msc: false,
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp',
        bio: 'Updated bio',
        githubUrl: 'https://github.com/john',
        linkedinUrl: 'https://linkedin.com/in/john',
        twitterUrl: 'https://twitter.com/john',
        websiteUrl: 'https://john.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        isRemote: false,
        isEntrepreneur: false,
        isIseChampion: false,
        professionalStatus: 'employed' as const
      }

      const updatedProfile = createMockProfile({
        id: '1',
        user_id: '1',
        full_name: 'John Updated',
        city: 'New York',
        country: 'USA',
        graduation_year: 2020,
        job_title: 'Senior Software Engineer',
        company: 'Tech Corp',
        bio: 'Updated bio',
        github_url: 'https://github.com/john',
        linkedin_url: 'https://linkedin.com/in/john',
        twitter_url: 'https://twitter.com/john',
        website_url: 'https://john.com',
        avatar_url: 'https://example.com/avatar.jpg',
        professional_status: 'employed',
        updated_at: '2024-01-15T00:00:00Z'
      })

      const mockSingle = vi.fn().mockResolvedValue({
        data: updatedProfile,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ update: mockUpdate })

      const result = await updateProfile(userId, formData)

      expect(mockedSupabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toEqual(updatedProfile)
    })

    it('should handle update errors gracefully', async () => {
      const mockError = new Error('Update failed')

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ update: mockUpdate })

      const formData = {
        fullName: 'Test',
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
        professionalStatus: null
      }

      const result = await updateProfile('1', formData)

      expect(log.error).toHaveBeenCalledWith('Error updating profile:', mockError)
      expect(result).toBeNull()
    })
  })

  describe('searchProfiles', () => {
    it('should search profiles successfully', async () => {
      const mockProfiles = [createMockProfile({ professional_status: 'employed' })]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockProfiles,
        error: null
      })
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder })
      const mockEq2 = vi.fn().mockReturnValue({ or: mockOr })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await searchProfiles('john')

      expect(mockedSupabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockProfiles[0])
    })

    it('should handle search errors gracefully', async () => {
      const mockError = new Error('Search failed')

      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder })
      const mockEq2 = vi.fn().mockReturnValue({ or: mockOr })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await searchProfiles('test')

      expect(log.error).toHaveBeenCalledWith('Error searching profiles:', mockError)
      expect(result).toEqual([])
    })

    it('should handle empty search results', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder })
      const mockEq2 = vi.fn().mockReturnValue({ or: mockOr })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await searchProfiles('nonexistent')

      expect(result).toEqual([])
    })
  })

  describe('isProfileComplete', () => {
    it('should return true for complete profiles', () => {
      const profile = createMockProfile({ job_title: 'Software Engineer' })
      expect(isProfileComplete(profile)).toBe(true)
    })

    it('should return false for incomplete profiles', () => {
      const profile = createMockProfile({
        full_name: '',
        bio: '',
        company: '',
        cohort: null,
        job_title: null
      })
      expect(isProfileComplete(profile)).toBe(false)
    })

    it('should handle profiles with missing optional fields', () => {
      const profile = createMockProfile({ company: null, job_title: 'Software Engineer' })
      expect(isProfileComplete(profile)).toBe(false) // company is null, so should be false
    })
  })

  describe('getProfileById', () => {
    it('should fetch profile by profile ID successfully', async () => {
      const mockProfile = createMockProfile({ id: 'profile-123', user_id: 'user-123' })

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      })
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getProfileById('profile-123')

      expect(mockedSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockEq1).toHaveBeenCalledWith('id', 'profile-123')
      expect(mockEq2).toHaveBeenCalledWith('removed', false)
      expect(result).toEqual(mockProfile)
    })

    it('should return null when profile not found', async () => {
      const mockError = new Error('No rows found')

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getProfileById('non-existent')

      expect(log.error).toHaveBeenCalledWith('Error fetching profile by ID:', mockError)
      expect(result).toBeNull()
    })
  })

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      const userId = 'user-123'
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const publicUrl = 'https://example.com/avatars/user-123.jpg'

      mockedSupabase.storage = {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl } })
        })
      } as any

      const result = await uploadAvatar(userId, file)

      expect(mockedSupabase.storage.from).toHaveBeenCalledWith('avatars')
      expect(result).toBe(publicUrl)
    })

    it('should handle upload errors', async () => {
      const userId = 'user-123'
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const uploadError = { message: 'Upload failed' }

      mockedSupabase.storage = {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: uploadError })
        })
      } as any

      const result = await uploadAvatar(userId, file)

      expect(log.error).toHaveBeenCalledWith('Error uploading avatar:', uploadError)
      expect(result).toBeNull()
    })

    it('should handle unexpected errors', async () => {
      const userId = 'user-123'
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })

      mockedSupabase.storage = {
        from: vi.fn().mockImplementation(() => {
          throw new Error('Storage error')
        })
      } as any

      const result = await uploadAvatar(userId, file)

      expect(log.error).toHaveBeenCalledWith('Error in uploadAvatar:', expect.any(Error))
      expect(result).toBeNull()
    })
  })

  describe('calculateProfileCompletionPercentage', () => {
    it('should return 0 for null profile', () => {
      expect(calculateProfileCompletionPercentage(null)).toBe(0)
    })

    it('should return 100 for complete profile', () => {
      const profile = createMockProfile({ job_title: 'Software Engineer' })
      expect(calculateProfileCompletionPercentage(profile)).toBe(100)
    })

    it('should return 50 for half-complete profile', () => {
      const profile = createMockProfile({ company: null, job_title: null })
      expect(calculateProfileCompletionPercentage(profile)).toBe(50)
    })

    it('should return 0 for empty profile', () => {
      const profile = createMockProfile({ full_name: '', bio: '', company: null, job_title: null })
      expect(calculateProfileCompletionPercentage(profile)).toBe(0)
    })

    it('should handle whitespace-only fields', () => {
      const profile = createMockProfile({ full_name: '   ', job_title: '   ' })
      expect(calculateProfileCompletionPercentage(profile)).toBe(50)
    })
  })
})
