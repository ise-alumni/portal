 
import { describe, it, expect, vi, beforeEach } from 'vitest'

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

// Import tag functions after mocking
const {
  createTag,
  updateTag,
  deleteTag,
  getTagById
} = await import('../tags-helpers')

describe('Tags helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTag', () => {
    it('should create tag successfully', async () => {
      const mockTag = { id: '1', name: 'React', color: '#61DAFB' }

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockTag,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      mockedSupabase.from.mockReturnValue({ insert: mockInsert })

      const result = await createTag('React', '#61DAFB')

      expect(mockedSupabase.from).toHaveBeenCalledWith('tags')
      expect(mockInsert).toHaveBeenCalledWith({ name: 'React', color: '#61DAFB' })
      expect(result).toEqual(mockTag)
    })

    it('should handle creation errors', async () => {
      const mockError = new Error('Creation failed')

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      mockedSupabase.from.mockReturnValue({ insert: mockInsert })

      const result = await createTag('React', '#61DAFB')

      expect(log.error).toHaveBeenCalledWith('Error creating tag:', mockError)
      expect(result).toBeNull()
    })
  })

  describe('updateTag', () => {
    it('should update tag successfully', async () => {
      const mockTag = { id: '1', name: 'React Updated', color: '#61DAFB' }

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockTag,
        error: null
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ update: mockUpdate })

      const result = await updateTag('1', 'React Updated', '#61DAFB')

      expect(mockedSupabase.from).toHaveBeenCalledWith('tags')
      expect(mockUpdate).toHaveBeenCalledWith({ name: 'React Updated', color: '#61DAFB' })
      expect(mockEq).toHaveBeenCalledWith('id', '1')
      expect(result).toEqual(mockTag)
    })

    it('should handle update errors', async () => {
      const mockError = new Error('Update failed')

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ update: mockUpdate })

      const result = await updateTag('1', 'React', '#61DAFB')

      expect(log.error).toHaveBeenCalledWith('Error updating tag:', mockError)
      expect(result).toBeNull()
    })
  })

  describe('deleteTag', () => {
    it('should delete tag successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null })
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ delete: mockDelete })

      const result = await deleteTag('1')

      expect(mockedSupabase.from).toHaveBeenCalledWith('tags')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', '1')
      expect(result).toBe(true)
    })

    it('should handle deletion errors', async () => {
      const mockError = new Error('Delete failed')

      const mockEq = vi.fn().mockResolvedValue({ error: mockError })
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ delete: mockDelete })

      const result = await deleteTag('1')

      expect(log.error).toHaveBeenCalledWith('Error deleting tag:', mockError)
      expect(result).toBe(false)
    })
  })

  describe('getTagById', () => {
    it('should fetch tag by id successfully', async () => {
      const mockTag = { id: '1', name: 'React', color: '#61DAFB' }

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockTag,
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getTagById('1')

      expect(mockedSupabase.from).toHaveBeenCalledWith('tags')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('id', '1')
      expect(result).toEqual(mockTag)
    })

    it('should handle fetch errors', async () => {
      const mockError = new Error('Fetch failed')

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockedSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getTagById('1')

      expect(log.error).toHaveBeenCalledWith('Error fetching tag:', mockError)
      expect(result).toBeNull()
    })
  })
})

