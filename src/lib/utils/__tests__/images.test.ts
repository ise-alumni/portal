import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getRandomEventImage,
  getRandomAnnouncementImage,
  handleImageError
} from '../images'

// Mock Math.random for consistent testing
const mockMathRandom = vi.fn()
Object.defineProperty(global, 'Math', {
  value: {
    ...global.Math,
    random: mockMathRandom,
    floor: global.Math.floor,
    max: global.Math.max,
    min: global.Math.min
  },
  configurable: true
})

describe('Image utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRandomEventImage', () => {
    it('should return event image URL with correct format', () => {
      mockMathRandom.mockReturnValue(0.123) // Will result in 123 when multiplied by 1000
      
      const result = getRandomEventImage()
      
      expect(result).toBe('https://picsum.photos/seed/event123/400/200.jpg')
      expect(mockMathRandom).toHaveBeenCalled()
    })

    it('should generate different URLs for different random values', () => {
      mockMathRandom.mockReturnValueOnce(0.456).mockReturnValueOnce(0.789)
      
      const result1 = getRandomEventImage()
      const result2 = getRandomEventImage()
      
      expect(result1).toBe('https://picsum.photos/seed/event456/400/200.jpg')
      expect(result2).toBe('https://picsum.photos/seed/event789/400/200.jpg')
      expect(result1).not.toBe(result2)
    })

    it('should handle edge case of random value 0', () => {
      mockMathRandom.mockReturnValue(0)
      
      const result = getRandomEventImage()
      
      expect(result).toBe('https://picsum.photos/seed/event0/400/200.jpg')
    })

    it('should handle edge case of random value close to 1', () => {
      mockMathRandom.mockReturnValue(0.999)
      
      const result = getRandomEventImage()
      
      expect(result).toBe('https://picsum.photos/seed/event999/400/200.jpg')
    })

    it('should always return valid URL format', () => {
      // Test multiple calls to ensure consistency
      for (let i = 0; i < 10; i++) {
        mockMathRandom.mockReturnValue(i / 10)
        const result = getRandomEventImage()
        
        expect(result).toMatch(/^https:\/\/picsum\.photos\/seed\/event\d+\/400\/200\.jpg$/)
      }
    })
  })

  describe('getRandomAnnouncementImage', () => {
    it('should return announcement image URL with correct format', () => {
      mockMathRandom.mockReturnValue(0.321)
      
      const result = getRandomAnnouncementImage()
      
      expect(result).toBe('https://picsum.photos/seed/announcement321/400/200.jpg')
      expect(mockMathRandom).toHaveBeenCalled()
    })

    it('should generate different URLs for different random values', () => {
      mockMathRandom.mockReturnValueOnce(0.111).mockReturnValueOnce(0.222)
      
      const result1 = getRandomAnnouncementImage()
      const result2 = getRandomAnnouncementImage()
      
      expect(result1).toBe('https://picsum.photos/seed/announcement111/400/200.jpg')
      expect(result2).toBe('https://picsum.photos/seed/announcement222/400/200.jpg')
      expect(result1).not.toBe(result2)
    })

    it('should handle edge case of random value 0', () => {
      mockMathRandom.mockReturnValue(0)
      
      const result = getRandomAnnouncementImage()
      
      expect(result).toBe('https://picsum.photos/seed/announcement0/400/200.jpg')
    })

    it('should handle edge case of random value close to 1', () => {
      mockMathRandom.mockReturnValue(0.999)
      
      const result = getRandomAnnouncementImage()
      
      expect(result).toBe('https://picsum.photos/seed/announcement999/400/200.jpg')
    })

    it('should always return valid URL format', () => {
      // Test multiple calls to ensure consistency
      for (let i = 0; i < 10; i++) {
        mockMathRandom.mockReturnValue(i / 10)
        const result = getRandomAnnouncementImage()
        
        expect(result).toMatch(/^https:\/\/picsum\.photos\/seed\/announcement\d+\/400\/200\.jpg$/)
      }
    })
  })

  describe('handleImageError', () => {
    let mockImageElement: HTMLImageElement

    beforeEach(() => {
      mockImageElement = {
        src: '',
      } as HTMLImageElement
      
      mockMathRandom.mockReturnValue(0.555) // Will result in 555
    })

    it('should replace event image src when error occurs', () => {
      mockImageElement.src = 'https://example.com/event123.jpg'
      
      const mockEvent = {
        target: mockImageElement
      } as React.SyntheticEvent<HTMLImageElement>
      
      handleImageError(mockEvent)
      
      expect(mockImageElement.src).toBe('https://picsum.photos/seed/event555/400/200.jpg')
    })

    it('should replace announcement image src when error occurs', () => {
      mockImageElement.src = 'https://example.com/announcement456.jpg'
      
      const mockEvent = {
        target: mockImageElement
      } as React.SyntheticEvent<HTMLImageElement>
      
      handleImageError(mockEvent)
      
      expect(mockImageElement.src).toBe('https://picsum.photos/seed/announcement555/400/200.jpg')
    })

    it('should use fallback image for non-event/announcement images', () => {
      mockImageElement.src = 'https://example.com/other-image.jpg'
      
      const mockEvent = {
        target: mockImageElement
      } as React.SyntheticEvent<HTMLImageElement>
      
      handleImageError(mockEvent)
      
      expect(mockImageElement.src).toBe('https://picsum.photos/seed/fallback555/400/200.jpg')
    })

    it('should handle empty src', () => {
      mockImageElement.src = ''
      
      const mockEvent = {
        target: mockImageElement
      } as React.SyntheticEvent<HTMLImageElement>
      
      handleImageError(mockEvent)
      
      expect(mockImageElement.src).toBe('https://picsum.photos/seed/fallback555/400/200.jpg')
    })

    it('should be case insensitive for event detection', () => {
      const testCases = [
        'https://example.com/EVENT123.jpg',
        'https://example.com/Event456.jpg',
        'https://example.com/eVeNt789.jpg'
      ]
      
      testCases.forEach(src => {
        mockImageElement.src = src
        const mockEvent = {
          target: mockImageElement
        } as React.SyntheticEvent<HTMLImageElement>
        
        handleImageError(mockEvent)
        
        expect(mockImageElement.src).toBe('https://picsum.photos/seed/event555/400/200.jpg')
      })
    })

    it('should be case insensitive for announcement detection', () => {
      const testCases = [
        'https://example.com/ANNOUNCEMENT123.jpg',
        'https://example.com/Announcement456.jpg',
        'https://example.com/aNnOuNcEmEnT789.jpg'
      ]
      
      testCases.forEach(src => {
        mockImageElement.src = src
        const mockEvent = {
          target: mockImageElement
        } as React.SyntheticEvent<HTMLImageElement>
        
        handleImageError(mockEvent)
        
        expect(mockImageElement.src).toBe('https://picsum.photos/seed/announcement555/400/200.jpg')
      })
    })

    it('should generate different fallback images on multiple calls', () => {
      mockImageElement.src = 'https://example.com/other.jpg'
      
      const mockEvent = {
        target: mockImageElement
      } as React.SyntheticEvent<HTMLImageElement>
      
      // First call
      mockMathRandom.mockReturnValue(0.111)
      handleImageError(mockEvent)
      const firstSrc = mockImageElement.src
      
      // Second call
      mockMathRandom.mockReturnValue(0.222)
      handleImageError(mockEvent)
      const secondSrc = mockImageElement.src
      
      expect(firstSrc).toBe('https://picsum.photos/seed/fallback111/400/200.jpg')
      expect(secondSrc).toBe('https://picsum.photos/seed/fallback222/400/200.jpg')
      expect(firstSrc).not.toBe(secondSrc)
    })

    it('should handle URLs with query parameters', () => {
      mockImageElement.src = 'https://example.com/event123.jpg?width=400&height=200'
      
      const mockEvent = {
        target: mockImageElement
      } as React.SyntheticEvent<HTMLImageElement>
      
      handleImageError(mockEvent)
      
      expect(mockImageElement.src).toBe('https://picsum.photos/seed/event555/400/200.jpg')
    })

    it('should handle URLs with paths', () => {
      mockImageElement.src = 'https://example.com/images/event/123.jpg'
      
      const mockEvent = {
        target: mockImageElement
      } as React.SyntheticEvent<HTMLImageElement>
      
      handleImageError(mockEvent)
      
      expect(mockImageElement.src).toBe('https://picsum.photos/seed/event555/400/200.jpg')
    })
  })

  describe('Image URL format consistency', () => {
    it('should maintain consistent dimensions across all functions', () => {
      mockMathRandom.mockReturnValue(0.123)
      
      const eventImage = getRandomEventImage()
      const announcementImage = getRandomAnnouncementImage()
      
      expect(eventImage).toContain('/400/200.jpg')
      expect(announcementImage).toContain('/400/200.jpg')
    })

    it('should use consistent domain and format', () => {
      mockMathRandom.mockReturnValue(0.456)
      
      const eventImage = getRandomEventImage()
      const announcementImage = getRandomAnnouncementImage()
      
      expect(eventImage).toMatch(/^https:\/\/picsum\.photos\/seed\//)
      expect(announcementImage).toMatch(/^https:\/\/picsum\.photos\/seed\//)
    })
  })
})