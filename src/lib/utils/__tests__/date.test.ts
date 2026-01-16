import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  formatDate,
  formatDateShort,
  isDateInPast,
  isDateInFuture,
  isDateWithinLastDays
} from '../date'

describe('Date utilities', () => {
  let mockDate: Date

  beforeEach(() => {
    // Mock current date for consistent testing
    mockDate = new Date('2024-01-15T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatDate', () => {
    it('should format date with full details', () => {
      const dateString = '2024-01-15T14:30:00Z'
      const result = formatDate(dateString)
      
      // Should include weekday, date, and time
      expect(result).toContain('2024')
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2:30') // Time will be formatted based on timezone
    })

    it('should handle different date formats', () => {
      const isoDate = '2024-12-25T10:00:00.000Z'
      const result = formatDate(isoDate)
      
      expect(result).toContain('2024')
      expect(result).toContain('Dec')
      expect(result).toContain('25')
    })

    it('should handle invalid dates gracefully', () => {
      const invalidDate = 'invalid-date'
      // The function should not throw, but may return 'Invalid Date' or similar
      expect(() => formatDate(invalidDate)).not.toThrow()
    })
  })

  describe('formatDateShort', () => {
    it('should format date in short format', () => {
      const dateString = '2024-01-15T14:30:00Z'
      const result = formatDateShort(dateString)
      
      // Should include date but not time
      expect(result).toContain('2024')
      expect(result).toContain('1')
      expect(result).toContain('15')
    })

    it('should handle different locales consistently', () => {
      const dateString = '2024-01-15T14:30:00Z'
      const result = formatDateShort(dateString)
      
      // Should be a valid date string
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('isDateInPast', () => {
    it('should return true for dates in the past', () => {
      const pastDate = '2024-01-10T12:00:00Z'
      expect(isDateInPast(pastDate)).toBe(true)
    })

    it('should return false for dates in the future', () => {
      const futureDate = '2024-01-20T12:00:00Z'
      expect(isDateInPast(futureDate)).toBe(false)
    })

    it('should return false for current date', () => {
      const currentDate = '2024-01-15T12:00:00Z'
      expect(isDateInPast(currentDate)).toBe(false)
    })

    it('should handle edge cases correctly', () => {
      const justBefore = '2024-01-15T11:59:59Z'
      const justAfter = '2024-01-15T12:00:01Z'
      
      expect(isDateInPast(justBefore)).toBe(true)
      expect(isDateInPast(justAfter)).toBe(false)
    })
  })

  describe('isDateInFuture', () => {
    it('should return true for dates in the future', () => {
      const futureDate = '2024-01-20T12:00:00Z'
      expect(isDateInFuture(futureDate)).toBe(true)
    })

    it('should return false for dates in the past', () => {
      const pastDate = '2024-01-10T12:00:00Z'
      expect(isDateInFuture(pastDate)).toBe(false)
    })

    it('should return true for current date (>=)', () => {
      const currentDate = '2024-01-15T12:00:00Z'
      expect(isDateInFuture(currentDate)).toBe(true)
    })

    it('should handle edge cases correctly', () => {
      const justBefore = '2024-01-15T11:59:59Z'
      const justAfter = '2024-01-15T12:00:01Z'
      
      expect(isDateInFuture(justBefore)).toBe(false)
      expect(isDateInFuture(justAfter)).toBe(true)
    })
  })

  describe('isDateWithinLastDays', () => {
    it('should return true for date within specified days', () => {
      const recentDate = '2024-01-13T12:00:00Z' // 2 days ago
      expect(isDateWithinLastDays(recentDate, 7)).toBe(true)
    })

    it('should return false for date outside specified days', () => {
      const oldDate = '2024-01-01T12:00:00Z' // 14 days ago
      expect(isDateWithinLastDays(oldDate, 7)).toBe(false)
    })

    it('should return true for exactly the boundary', () => {
      const boundaryDate = '2024-01-08T12:00:00Z' // Exactly 7 days ago
      expect(isDateWithinLastDays(boundaryDate, 7)).toBe(true)
    })

    it('should return true for current date', () => {
      const currentDate = '2024-01-15T12:00:00Z'
      expect(isDateWithinLastDays(currentDate, 7)).toBe(true)
    })

    it('should handle different day values', () => {
      const date1DayAgo = '2024-01-14T12:00:00Z'
      const date30DaysAgo = '2023-12-16T12:00:00Z'
      
      expect(isDateWithinLastDays(date1DayAgo, 1)).toBe(true)
      expect(isDateWithinLastDays(date30DaysAgo, 30)).toBe(true)
      expect(isDateWithinLastDays(date30DaysAgo, 29)).toBe(false)
    })

    it('should handle edge case of 0 days', () => {
      const currentDate = '2024-01-15T12:00:00Z'
      const pastDate = '2024-01-14T12:00:00Z'
      
      expect(isDateWithinLastDays(currentDate, 0)).toBe(true)
      expect(isDateWithinLastDays(pastDate, 0)).toBe(false)
    })

    it('should handle time precision correctly', () => {
      const justWithinBoundary = '2024-01-08T12:00:01Z' // Just over 7 days
      const justInsideBoundary = '2024-01-08T12:00:00Z' // Exactly 7 days
      
      expect(isDateWithinLastDays(justWithinBoundary, 7)).toBe(true) // 1 second after cutoff is still within range
      expect(isDateWithinLastDays(justInsideBoundary, 7)).toBe(true)
    })
  })

  describe('Date edge cases', () => {
    it('should handle leap year dates', () => {
      const leapYearDate = '2024-02-29T12:00:00Z'
      expect(() => {
        formatDate(leapYearDate)
        formatDateShort(leapYearDate)
        isDateInPast(leapYearDate)
        isDateInFuture(leapYearDate)
        isDateWithinLastDays(leapYearDate, 30)
      }).not.toThrow()
    })

    it('should handle year boundaries', () => {
      const endOfYear = '2023-12-31T23:59:59Z'
      const startOfYear = '2024-01-01T00:00:01Z'
      
      expect(() => {
        formatDate(endOfYear)
        formatDate(startOfYear)
        isDateInPast(endOfYear)
        isDateInFuture(startOfYear)
      }).not.toThrow()
    })

    it('should handle timezone differences', () => {
      const utcDate = '2024-01-15T00:00:00Z'
      const result = formatDate(utcDate)
      
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })
})