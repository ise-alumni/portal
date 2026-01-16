/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest';

/**
 * Creates mock profile data for admin tests
 */
export function createMockProfileData(overrides: {
  email?: string;
  fullName?: string;
  graduationYear?: string;
  userType?: 'Alum' | 'Admin' | 'Staff';
  msc?: boolean;
} = {}) {
  return {
    email: 'test@example.com',
    fullName: 'Test User',
    graduationYear: '2020',
    userType: 'Alum' as const,
    msc: false,
    ...overrides
  };
}

/**
 * Creates mock Supabase query chain for profile operations
 */
export function createMockProfileQueryChain(mockSupabase: any, result: { data: any; error: any }) {
  const mockSingle = vi.fn().mockResolvedValue(result);
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  mockSupabase.from.mockReturnValue({ select: mockSelect } as any);
  return { mockSingle, mockEq, mockSelect };
}

/**
 * Creates mock Supabase update chain for profile operations
 */
export function createMockProfileUpdateChain(mockSupabase: any, result: { error: any }) {
  const mockEq = vi.fn().mockResolvedValue(result);
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  mockSupabase.from.mockReturnValue({ update: mockUpdate } as any);
  return { mockEq, mockUpdate };
}

/**
 * Mocks setTimeout to resolve immediately for testing
 */
export function mockSetTimeoutImmediate() {
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = vi.fn((fn: () => void) => {
    fn();
    return 1 as any;
  }) as any;
  return () => {
    global.setTimeout = originalSetTimeout;
  };
}

