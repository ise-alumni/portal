import { describe, it, expect } from 'vitest'
import { cn } from '../../utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('should handle conditional classes', () => {
    expect(cn('base-class', true && 'conditional-class', false && 'hidden-class')).toBe('base-class conditional-class')
  })

  it('should handle undefined and null values', () => {
    expect(cn('base-class', undefined, null, 'another-class')).toBe('base-class another-class')
  })

  it('should handle empty strings', () => {
    expect(cn('base-class', '', 'another-class')).toBe('base-class another-class')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['px-4', 'py-2'], 'bg-blue-500')).toBe('px-4 py-2 bg-blue-500')
  })

  it('should handle objects with boolean values', () => {
    expect(cn({
      'px-4': true,
      'py-2': true,
      'hidden': false,
      'bg-blue-500': true
    })).toBe('px-4 py-2 bg-blue-500')
  })

  it('should handle complex mixed inputs', () => {
    expect(cn(
      'base-class',
      {
        'conditional': true,
        'hidden': false
      },
      ['array-class-1', 'array-class-2'],
      true && 'truthy-class',
      null,
      undefined
    )).toBe('base-class conditional array-class-1 array-class-2 truthy-class')
  })

  it('should handle conflicting Tailwind classes correctly', () => {
    expect(cn('px-4', 'px-8')).toBe('px-8')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('should return empty string when no classes provided', () => {
    expect(cn()).toBe('')
    expect(cn(null, undefined, '')).toBe('')
  })
})