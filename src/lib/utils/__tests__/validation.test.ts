import { describe, it, expect } from 'vitest';
import { 
  validateEmail, 
  validateUrl, 
  validateRequired, 
  validateMinLength, 
  validateProfileForm 
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@.')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://localhost:3000')).toBe(true);
      expect(validateUrl('https://www.github.com/user/repo')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('www.example.com')).toBe(false);
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should pass for non-empty values', () => {
      expect(validateRequired('test', 'field')).toEqual({
        isValid: true,
        errors: {}
      });
      expect(validateRequired(0, 'field')).toEqual({
        isValid: true,
        errors: {}
      });
      expect(validateRequired(false, 'field')).toEqual({
        isValid: true,
        errors: {}
      });
    });

    it('should fail for empty values', () => {
      expect(validateRequired('', 'field')).toEqual({
        isValid: false,
        errors: { field: 'field is required' }
      });
      expect(validateRequired(null, 'field')).toEqual({
        isValid: false,
        errors: { field: 'field is required' }
      });
      expect(validateRequired(undefined, 'field')).toEqual({
        isValid: false,
        errors: { field: 'field is required' }
      });
      expect(validateRequired('   ', 'field')).toEqual({
        isValid: false,
        errors: { field: 'field is required' }
      });
    });
  });

  describe('validateMinLength', () => {
    it('should pass for valid length', () => {
      expect(validateMinLength('test', 3, 'field')).toEqual({
        isValid: true,
        errors: {}
      });
    });

    it('should fail for short values', () => {
      expect(validateMinLength('ab', 3, 'field')).toEqual({
        isValid: false,
        errors: { field: 'field must be at least 3 characters' }
      });
    });

    it('should pass for empty values', () => {
      expect(validateMinLength('', 3, 'field')).toEqual({
        isValid: true,
        errors: {}
      });
    });
  });

  describe('validateProfileForm', () => {
    it('should validate complete profile form', () => {
      const validData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        githubUrl: 'https://github.com/johndoe',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        twitterUrl: 'https://twitter.com/johndoe',
        websiteUrl: 'https://johndoe.com'
      };

      const result = validateProfileForm(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should catch validation errors', () => {
      const invalidData = {
        fullName: 'J',
        email: 'invalid-email',
        githubUrl: 'not-a-url',
        linkedinUrl: 'not-a-url',
        twitterUrl: 'not-a-url',
        websiteUrl: 'not-a-url'
      };

      const result = validateProfileForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toContain('fullName');
      expect(Object.keys(result.errors)).toContain('email');
      expect(Object.keys(result.errors)).toContain('githubUrl');
      expect(Object.keys(result.errors)).toContain('linkedinUrl');
      expect(Object.keys(result.errors)).toContain('twitterUrl');
      expect(Object.keys(result.errors)).toContain('websiteUrl');
    });

    it('should handle partial data', () => {
      const partialData = {
        fullName: 'Jane Doe',
        email: 'jane@example.com'
      };

      const result = validateProfileForm(partialData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });
});