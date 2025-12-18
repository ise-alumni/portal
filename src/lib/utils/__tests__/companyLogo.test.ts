import { describe, it, expect } from 'vitest';
import { buildCompanyLogoMap, getCompanyLogoUrl } from '@/lib/utils/companyLogo';
import type { ResidencyPartner } from '@/lib/types/residency';

const partners: ResidencyPartner[] = [
  {
    id: '1',
    name: 'Intercom',
    website: null,
    logo_url: 'https://example.com/intercom.png',
    description: null,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: '2',
    name: 'Stripe',
    website: null,
    logo_url: 'https://example.com/stripe.png',
    description: null,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
];

describe('companyLogo helpers', () => {
  const logoMap = buildCompanyLogoMap(partners);

  it('matches exact company name', () => {
    expect(getCompanyLogoUrl('Intercom', logoMap)).toBe('https://example.com/intercom.png');
  });

  it('matches case-insensitively and trims whitespace', () => {
    expect(getCompanyLogoUrl('  stripe  ', logoMap)).toBe('https://example.com/stripe.png');
  });

  it('returns null for unknown company', () => {
    expect(getCompanyLogoUrl('Unknown Co', logoMap)).toBeNull();
  });

  it('returns null for empty or null names', () => {
    expect(getCompanyLogoUrl('', logoMap)).toBeNull();
    expect(getCompanyLogoUrl('   ', logoMap)).toBeNull();
    expect(getCompanyLogoUrl(null as unknown as string, logoMap)).toBeNull();
  });
});

