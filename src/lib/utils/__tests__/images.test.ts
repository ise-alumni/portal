import { describe, it, expect, vi } from 'vitest'
import {
  generatePlaceholderUrl,
  handleImageError,
  getProfileInitials
} from '../images'

describe('Image utilities', () => {
  describe('generatePlaceholderUrl', () => {
    it('should generate placeholder URL with type and id', () => {
      const url = generatePlaceholderUrl('Event', '123')
      expect(url).toBe('https://placehold.co/600x400?text=Event+123')
    })

    it('should handle numeric ids', () => {
      const url = generatePlaceholderUrl('Announcement', 456)
      expect(url).toBe('https://placehold.co/600x400?text=Announcement+456')
    })

    it('should handle different types', () => {
      const url = generatePlaceholderUrl('Image', 'test-id')
      expect(url).toBe('https://placehold.co/600x400?text=Image+test-id')
    })
  })

  describe('handleImageError', () => {
    it('should set fallback URL when provided', () => {
      const fallbackUrl = 'https://example.com/fallback.jpg'
      let imageSrc = 'https://example.com/original.jpg'
      const mockImage = {
        get src() {
          return imageSrc
        },
        set src(value: string) {
          imageSrc = value
        }
      } as HTMLImageElement

      const event = {
        target: mockImage
      } as React.SyntheticEvent<HTMLImageElement, Event>

      handleImageError(event, fallbackUrl)

      expect(imageSrc).toBe(fallbackUrl)
    })

    it('should generate placeholder when no fallback provided', () => {
      let imageSrc = 'https://example.com/Event/123.jpg'
      const mockImage = {
        get src() {
          return imageSrc
        },
        set src(value: string) {
          imageSrc = value
        }
      } as HTMLImageElement

      const event = {
        target: mockImage
      } as React.SyntheticEvent<HTMLImageElement, Event>

      handleImageError(event)

      expect(imageSrc).toContain('placehold.co')
      expect(imageSrc).toContain('Event')
    })

    it('should detect Announcement type from URL', () => {
      let imageSrc = 'https://example.com/Announcement/456.jpg'
      const mockImage = {
        get src() {
          return imageSrc
        },
        set src(value: string) {
          imageSrc = value
        }
      } as HTMLImageElement

      const event = {
        target: mockImage
      } as React.SyntheticEvent<HTMLImageElement, Event>

      handleImageError(event)

      expect(imageSrc).toContain('Announcement')
    })

    it('should default to Image type when type cannot be determined', () => {
      let imageSrc = 'https://example.com/unknown.jpg'
      const mockImage = {
        get src() {
          return imageSrc
        },
        set src(value: string) {
          imageSrc = value
        }
      } as HTMLImageElement

      const event = {
        target: mockImage
      } as React.SyntheticEvent<HTMLImageElement, Event>

      handleImageError(event)

      expect(imageSrc).toContain('Image')
    })
  })

  describe('getProfileInitials', () => {
    it('should extract initials from full name', () => {
      expect(getProfileInitials('John Doe')).toBe('JD')
    })

    it('should handle single name', () => {
      expect(getProfileInitials('John')).toBe('J')
    })

    it('should handle multiple words', () => {
      expect(getProfileInitials('John Michael Smith')).toBe('JM')
    })

    it('should convert to uppercase', () => {
      expect(getProfileInitials('john doe')).toBe('JD')
    })

    it('should handle mixed case', () => {
      expect(getProfileInitials('jOhN dOe')).toBe('JD')
    })

    it('should return "U" for null', () => {
      expect(getProfileInitials(null)).toBe('U')
    })

    it('should return "U" for undefined', () => {
      expect(getProfileInitials(undefined)).toBe('U')
    })

    it('should return "U" for empty string', () => {
      expect(getProfileInitials('')).toBe('U')
    })

    it('should handle names with extra spaces', () => {
      expect(getProfileInitials('  John   Doe  ')).toBe('JD')
    })

    it('should limit to 2 characters', () => {
      expect(getProfileInitials('A B C D E')).toBe('AB')
    })
  })
})

