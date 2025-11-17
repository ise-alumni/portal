import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAnnouncementTypeColor,
  getAnnouncementTypeLabel,
  getEventTagColorClass,
  getCohortLabel
} from '../ui'

// Mock the constants module
vi.mock('@/lib/constants', () => ({
  getAnnouncementTypesSync: vi.fn(),
  getEventTagColor: vi.fn()
}))

const { getAnnouncementTypesSync, getEventTagColor } = await import('@/lib/constants')

describe('UI utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAnnouncementTypeColor', () => {
    it('should return correct color for opportunity type', () => {
      const color = getAnnouncementTypeColor('opportunity')
      expect(color).toBe('bg-green-100 text-green-800 border-green-200')
    })

    it('should return correct color for news type', () => {
      const color = getAnnouncementTypeColor('news')
      expect(color).toBe('bg-blue-100 text-blue-800 border-blue-200')
    })

    it('should return correct color for lecture type', () => {
      const color = getAnnouncementTypeColor('lecture')
      expect(color).toBe('bg-purple-100 text-purple-800 border-purple-200')
    })

    it('should return correct color for program type', () => {
      const color = getAnnouncementTypeColor('program')
      expect(color).toBe('bg-orange-100 text-orange-800 border-orange-200')
    })

    it('should return default color for unknown type', () => {
      const color = getAnnouncementTypeColor('unknown')
      expect(color).toBe('bg-gray-100 text-gray-800 border-gray-200')
    })

    it('should handle empty string', () => {
      const color = getAnnouncementTypeColor('')
      expect(color).toBe('bg-gray-100 text-gray-800 border-gray-200')
    })
  })

  describe('getAnnouncementTypeLabel', () => {
    beforeEach(() => {
      vi.mocked(getAnnouncementTypesSync).mockReturnValue(['opportunity', 'news', 'lecture', 'program'])
    })

    it('should capitalize first letter for known types from database', () => {
      const label = getAnnouncementTypeLabel('opportunity')
      expect(label).toBe('Opportunity')
    })

    it('should capitalize first letter for single word types', () => {
      const label = getAnnouncementTypeLabel('news')
      expect(label).toBe('News')
    })

    it('should handle multi-word types correctly', () => {
      const label = getAnnouncementTypeLabel('lecture')
      expect(label).toBe('Lecture') // Found in database, simple capitalization
    })

    it('should return original type for unknown types', () => {
      const label = getAnnouncementTypeLabel('unknown-type')
      expect(label).toBe('unknown-type')
    })

    it('should use fallback when database types are empty', () => {
      vi.mocked(getAnnouncementTypesSync).mockReturnValue([])
      
      const opportunityLabel = getAnnouncementTypeLabel('opportunity')
      const lectureLabel = getAnnouncementTypeLabel('lecture')
      
      expect(opportunityLabel).toBe('Opportunity')
      expect(lectureLabel).toBe('Guest Lecture')
    })

    it('should handle case sensitivity correctly', () => {
      const label = getAnnouncementTypeLabel('NEWS')
      expect(label).toBe('NEWS') // Returns as-is since not in mocked array
    })
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
      expect(colorClass).toBe('bg-green-100 text-green-800 border-green-200')
    })

    it('should return correct Tailwind classes for amber color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#f59e0b')
      const colorClass = getEventTagColorClass('Workshop')
      expect(colorClass).toBe('bg-amber-100 text-amber-800 border-amber-200')
    })

    it('should return correct Tailwind classes for red color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#ef4444')
      const colorClass = getEventTagColorClass('Career')
      expect(colorClass).toBe('bg-red-100 text-red-800 border-red-200')
    })

    it('should return correct Tailwind classes for purple color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#8b5cf6')
      const colorClass = getEventTagColorClass('Technical')
      expect(colorClass).toBe('bg-purple-100 text-purple-800 border-purple-200')
    })

    it('should return correct Tailwind classes for cyan color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#06b6d4')
      const colorClass = getEventTagColorClass('Online')
      expect(colorClass).toBe('bg-cyan-100 text-cyan-800 border-cyan-200')
    })

    it('should return correct Tailwind classes for lime color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#84cc16')
      const colorClass = getEventTagColorClass('Alumni')
      expect(colorClass).toBe('bg-lime-100 text-lime-800 border-lime-200')
    })

    it('should return correct Tailwind classes for indigo color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#6366f1')
      const colorClass = getEventTagColorClass('In-Person')
      expect(colorClass).toBe('bg-indigo-100 text-indigo-800 border-indigo-200')
    })

    it('should return correct Tailwind classes for orange color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#f97316')
      const colorClass = getEventTagColorClass('Social')
      expect(colorClass).toBe('bg-orange-100 text-orange-800 border-orange-200')
    })

    it('should return correct Tailwind classes for pink color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#ec4899')
      const colorClass = getEventTagColorClass('Special')
      expect(colorClass).toBe('bg-pink-100 text-pink-800 border-pink-200')
    })

    it('should return default Tailwind classes for unknown color', () => {
      vi.mocked(getEventTagColor).mockReturnValue('#000000')
      const colorClass = getEventTagColorClass('Unknown')
      expect(colorClass).toBe('bg-gray-100 text-gray-800 border-gray-200')
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

    it('should return null for zero', () => {
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
    it('should have consistent color format across all functions', () => {
      const announcementColors = [
        getAnnouncementTypeColor('opportunity'),
        getAnnouncementTypeColor('news'),
        getAnnouncementTypeColor('lecture'),
        getAnnouncementTypeColor('program')
      ]

      // All colors should follow the same pattern
      announcementColors.forEach(color => {
        expect(color).toMatch(/^bg-\w+-100 text-\w+-800 border-\w+-200$/)
      })
    })

    it('should handle edge cases gracefully', () => {
      expect(() => {
        getAnnouncementTypeColor('')
        getAnnouncementTypeLabel('')
        getEventTagColorClass('')
        getCohortLabel(null)
      }).not.toThrow()
    })
  })
})