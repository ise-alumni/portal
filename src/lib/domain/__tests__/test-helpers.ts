 
import { vi } from 'vitest';
import type { UserRole } from '@/lib/types/common';
import type { Profile } from '@/lib/types';

/**
 * Creates a mock profile object for testing
 */
export function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: '1',
    user_id: '1',
    full_name: 'John Doe',
    bio: 'React developer',
    company: 'Tech Corp',
    cohort: 2020,
    user_type: 'Alum' as UserRole,
    email: 'john@example.com',
    avatar_url: null,
    city: null,
    country: null,
    graduation_year: null,
    job_title: null,
    github_url: null,
    linkedin_url: null,
    twitter_url: null,
    website_url: null,
    is_public: true,
    msc: false,
    is_remote: false,
    is_entrepreneur: false,
    is_ise_champion: false,
    professional_status: null,
    removed: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  };
}

