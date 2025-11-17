import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UserRole } from '@/lib/types/common'

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
      const mockProfiles = [
        {
          id: '1',
          user_id: '1',
          full_name: 'John Doe',

          bio: 'React developer',
          company: 'Tech Corp',
          cohort: 2020,
          user_type: 'Alum' as UserRole,
          email: 'john@example.com',
          email_visible: true,
          avatar_url: null,
          city: null,
          country: null,
          graduation_year: null,
          job_title: null,
          github_url: null,
          linkedin_url: null,
          twitter_url: null,
          website_url: null,
          is_public: true,
          msc: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          user_id: '2',
          full_name: 'Jane Smith',

          bio: 'Product enthusiast',
          company: 'StartupCo',
          cohort: 2021,
          user_type: 'Alum' as UserRole,
          email: 'jane@example.com',
          email_visible: false,
          avatar_url: null,
          city: null,
          country: null,
          graduation_year: null,
          job_title: null,
          github_url: null,
          linkedin_url: null,
          twitter_url: null,
          website_url: null,
          is_public: true,
          msc: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockProfiles,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getProfiles()

      expect(mockedSupabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toHaveLength(2)
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
      const mockProfile = {
        id: '1',
        user_id: '1',
        full_name: 'John Doe',
        bio: 'React developer',
        company: 'Tech Corp',
        cohort: 2020,
        user_type: 'Alum' as UserRole,
        email: 'john@example.com',
        email_visible: true,
        avatar_url: null,
        city: null,
        country: null,
        graduation_year: null,
        job_title: null,
        github_url: null,
        linkedin_url: null,
        twitter_url: null,
        website_url: null,
        is_public: true,
        msc: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

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
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getProfileByUserId('non-existent')

      expect(log.error).toHaveBeenCalledWith('Error fetching profile:', mockError)
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
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp',
        bio: 'Updated bio',
        githubUrl: 'https://github.com/john',
        linkedinUrl: 'https://linkedin.com/in/john',
        twitterUrl: 'https://twitter.com/john',
        websiteUrl: 'https://john.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        emailVisible: true
      }

      const updatedProfile = {
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
        email_visible: true,
        cohort: 2020,
        user_type: 'Alum' as UserRole,
        email: 'john@example.com',
        is_public: true,
        msc: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      }

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
        jobTitle: '',
        company: '',
        bio: '',
        githubUrl: '',
        linkedinUrl: '',
        twitterUrl: '',
        websiteUrl: '',
        avatarUrl: '',
        emailVisible: false
      }

      const result = await updateProfile('1', formData)

      expect(log.error).toHaveBeenCalledWith('Error updating profile:', mockError)
      expect(result).toBeNull()
    })
  })

  describe('searchProfiles', () => {
    it('should search profiles successfully', async () => {
      const mockProfiles = [
        {
          id: '1',
          user_id: '1',
          full_name: 'John Doe',

          bio: 'React developer',
          company: 'Tech Corp',
          cohort: 2020,
          user_type: 'Alum' as UserRole,
          email: 'john@example.com',
          email_visible: true,
          avatar_url: null,
          city: null,
          country: null,
          graduation_year: null,
          job_title: null,
          github_url: null,
          linkedin_url: null,
          twitter_url: null,
          website_url: null,
          is_public: true,
          msc: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockProfiles,
        error: null
      })
      const mockOr = vi.fn().mockReturnValue({ order: mockOrder })
      const mockEq = vi.fn().mockReturnValue({ or: mockOr })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

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
      const mockEq = vi.fn().mockReturnValue({ or: mockOr })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

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
      const mockEq = vi.fn().mockReturnValue({ or: mockOr })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await searchProfiles('nonexistent')

      expect(result).toEqual([])
    })
  })

  describe('isProfileComplete', () => {
    it('should return true for complete profiles', () => {
      const profile = {
        id: '1',
        user_id: '1',
        full_name: 'John Doe',
        bio: 'React developer',
        company: 'Tech Corp',
        cohort: 2020,
        user_type: 'Alum' as UserRole,
        email: 'john@example.com',
        email_visible: true,
        avatar_url: null,
        city: null,
        country: null,
        graduation_year: null,
        job_title: 'Software Engineer',
        github_url: null,
        linkedin_url: null,
        twitter_url: null,
        website_url: null,
        is_public: true,
        msc: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      expect(isProfileComplete(profile)).toBe(true)
    })

    it('should return false for incomplete profiles', () => {
      const profile = {
        id: '1',
        user_id: '1',
        full_name: '',

        bio: '',
        company: '',
        cohort: null,
        user_type: 'Alum' as UserRole,
        email: 'john@example.com',
        email_visible: true,
        avatar_url: null,
        city: null,
        country: null,
        graduation_year: null,
        job_title: null,
        github_url: null,
        linkedin_url: null,
        twitter_url: null,
        website_url: null,
        is_public: true,
        msc: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      expect(isProfileComplete(profile)).toBe(false)
    })

    it('should handle profiles with missing optional fields', () => {
      const profile = {
        id: '1',
        user_id: '1',
        full_name: 'John Doe',
        bio: 'React developer',
        company: null,
        cohort: 2020,
        user_type: 'Alum' as UserRole,
        email: 'john@example.com',
        email_visible: true,
        avatar_url: null,
        city: null,
        country: null,
        graduation_year: null,
        job_title: 'Software Engineer',
        github_url: null,
        linkedin_url: null,
        twitter_url: null,
        website_url: null,
        is_public: true,
        msc: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      expect(isProfileComplete(profile)).toBe(false) // company is null, so should be false
    })
  })
})
