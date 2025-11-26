/**
 * Form validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateRequired(value: unknown, fieldName: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Check if value is empty (null, undefined, empty string, or whitespace only)
  const isEmpty = value === null || 
                  value === undefined || 
                  (typeof value === 'string' && value.trim() === '') ||
                  (typeof value === 'number' && isNaN(value));
  
  if (isEmpty) {
    errors[fieldName] = `${fieldName} is required`;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (value && value.length < minLength) {
    errors[fieldName] = `${fieldName} must be at least ${minLength} characters`;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateProfileForm(data: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Full name validation
  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }
  
  // Email validation
  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // URL validations
  if (data.githubUrl && !validateUrl(data.githubUrl)) {
    errors.githubUrl = 'Please enter a valid GitHub URL';
  }
  
  if (data.linkedinUrl && !validateUrl(data.linkedinUrl)) {
    errors.linkedinUrl = 'Please enter a valid LinkedIn URL';
  }
  
  if (data.twitterUrl && !validateUrl(data.twitterUrl)) {
    errors.twitterUrl = 'Please enter a valid Twitter URL';
  }
  
  if (data.websiteUrl && !validateUrl(data.websiteUrl)) {
    errors.websiteUrl = 'Please enter a valid website URL';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}