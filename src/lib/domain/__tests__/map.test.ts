import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
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
  getMapDataCurrent,
  getMapDataOvertime
} = await import('../map')

describe('Map domain functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMapDataCurrent', () => {
    it('should fetch current map data successfully', async () => {
      const mockData: Array<{
        profile_id: string
        full_name: string | null
        avatar_url: string | null
        company: string | null
        lat: number
        lng: number
        graduation_year: number | null
        cohort: string | null
        msc: string | null
        city: string | null
        country: string | null
      }> = [
        {
          profile_id: '1',
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
          company: 'Tech Corp',
          lat: 40.7128,
          lng: -74.0060,
          graduation_year: 2020,
          cohort: '2020',
          msc: 'false',
          city: 'New York',
          country: 'USA'
        }
      ]

      mockedSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await getMapDataCurrent()

      expect(mockedSupabase.rpc).toHaveBeenCalledWith('rpc_get_map_data', {
        view_mode: 'current'
      })
      expect(result).toEqual(mockData)
    })

    it('should handle RPC errors gracefully', async () => {
      const error = { message: 'RPC error', code: 'PGRST116' }
      mockedSupabase.rpc.mockResolvedValue({
        data: null,
        error
      })

      const result = await getMapDataCurrent()

      expect(log.error).toHaveBeenCalledWith('Error fetching current map data:', error)
      expect(result).toEqual([])
    })

    it('should handle null data', async () => {
      mockedSupabase.rpc.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await getMapDataCurrent()

      expect(result).toEqual([])
    })

    it('should handle unexpected errors', async () => {
      mockedSupabase.rpc.mockRejectedValue(new Error('Network error'))

      const result = await getMapDataCurrent()

      expect(log.error).toHaveBeenCalledWith('Error in getMapDataCurrent:', expect.any(Error))
      expect(result).toEqual([])
    })
  })

  describe('getMapDataOvertime', () => {
    it('should fetch overtime map data successfully', async () => {
      const mockData: Array<{
        profile_id: string
        full_name: string | null
        timestamps: string[] | null
        cities: (string | null)[] | null
        countries: (string | null)[] | null
        companies: (string | null)[] | null
        job_titles: (string | null)[] | null
        lats: number[] | null
        lngs: number[] | null
      }> = [
        {
          profile_id: '1',
          full_name: 'Test User',
          timestamps: ['2020-01-01', '2021-01-01'],
          cities: ['New York', 'San Francisco'],
          countries: ['USA', 'USA'],
          companies: ['Tech Corp', 'Other Corp'],
          job_titles: ['Engineer', 'Senior Engineer'],
          lats: [40.7128, 37.7749],
          lngs: [-74.0060, -122.4194]
        }
      ]

      mockedSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await getMapDataOvertime()

      expect(mockedSupabase.rpc).toHaveBeenCalledWith('rpc_get_map_data', {
        view_mode: 'overtime'
      })
      expect(result).toEqual(mockData)
    })

    it('should handle RPC errors gracefully', async () => {
      const error = { message: 'RPC error', code: 'PGRST116' }
      mockedSupabase.rpc.mockResolvedValue({
        data: null,
        error
      })

      const result = await getMapDataOvertime()

      expect(log.error).toHaveBeenCalledWith('Error fetching overtime map data:', error)
      expect(result).toEqual([])
    })

    it('should handle null data', async () => {
      mockedSupabase.rpc.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await getMapDataOvertime()

      expect(result).toEqual([])
    })

    it('should handle unexpected errors', async () => {
      mockedSupabase.rpc.mockRejectedValue(new Error('Network error'))

      const result = await getMapDataOvertime()

      expect(log.error).toHaveBeenCalledWith('Error in getMapDataOvertime:', expect.any(Error))
      expect(result).toEqual([])
    })
  })
})

