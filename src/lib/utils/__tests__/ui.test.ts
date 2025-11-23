import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getEventTagColorClass,
  getCohortLabel
} from '../ui'

// Mock the constants module
vi.mock('@/lib/constants', () => ({
  getEventTagColor: vi.fn()
}))

const { getEventTagColor } = await import('@/lib/constants')

describe('UI utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEventTagColorClass', () => {
    beforeEach(() => {
      vi.mocked(getEventTagColor).mockImplementation((tagName: string) => {
        const colorMap: Record<string, string> = {
          'Networking': '#10b981',
          'Workshop': '#f59e0b',
          'Career': '#ef4444',
          'Unknown': '#000000'
        }
        return colorMap[tagName] || '#3b82f6'
      })
    })

    it('should return correct Tailwind classes for green color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#10b981')
      const colorClass = getEventTagColorClass('Networking')
      expect(colorClass).toBe('bg-[#10b981] border-[#10b981] text-white')
    })

    it('should return correct Tailwind classes for amber color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#f59e0b')
      const colorClass = getEventTagColorClass('Workshop')
      expect(colorClass).toBe('bg-[#f59e0b] border-[#f59e0b] text-white')
    })

    it('should return correct Tailwind classes for red color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#ef4444')
      const colorClass = getEventTagColorClass('Career')
      expect(colorClass).toBe('bg-[#ef4444] border-[#ef4444] text-white')
    })

    it('should return correct Tailwind classes for unknown color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#000000')
      const colorClass = getEventTagColorClass('Unknown')
      expect(colorClass).toBe('bg-[#000000] border-[#000000] text-white')
    })

    it('should call getEventTagColor with correct tag name', () => {
      getEventTagColorClass('TestTag')
      expect(getEventTagColor).toHaveBeenCalledWith('TestTag')
    })
  })

  describe('getCohortLabel', () => {
    it('should return formatted cohort label for valid number', () => {
      const label = getCohortLabel(2023)
      expect(label).toBe('Cohort 2023')
    })

    it('should return null for null input', () => {
      const label = getCohortLabel(null)
      expect(label).toBeNull()
    })

    it('should return null for undefined input', () => {
      const label = getCohortLabel(undefined)
      expect(label).toBeNull()
    })

    it('should handle zero', () => {
      const label = getCohortLabel(0)
      expect(label).toBe('Cohort 0')
    })

    it('should handle negative numbers', () => {
      const label = getCohortLabel(-1)
      expect(label).toBe('Cohort -1')
    })

    it('should handle decimal numbers', () => {
      const label = getCohortLabel(2023.5)
      expect(label).toBe('Cohort 2023.5')
    })
  })

  describe('Color mapping consistency', () => {
    it('should handle edge cases gracefully', () => {
      expect(() => {
        getEventTagColorClass('')
        getCohortLabel(null)
      }).not.toThrow()
    })
  })
})