import type { ResidencyPartner } from '@/lib/types/residency';

export type CompanyLogoMap = Map<string, string | null>;

const normalizeName = (name: string): string =>
  name.trim().toLowerCase();

export const buildCompanyLogoMap = (
  partners: ResidencyPartner[]
): CompanyLogoMap => {
  const map: CompanyLogoMap = new Map();

  partners.forEach((partner) => {
    if (!partner.name) return;
    const key = normalizeName(partner.name);
    if (!map.has(key)) {
      map.set(key, partner.logo_url);
    }
  });

  return map;
};

export const getCompanyLogoUrl = (
  companyName: string | null | undefined,
  logoMap: CompanyLogoMap
): string | null => {
  if (!companyName) return null;

  const normalized = normalizeName(companyName);
  if (!normalized) return null;

  // Exact normalized match
  const direct = logoMap.get(normalized);
  if (direct) return direct;

  // Fuzzy match: company contains partner name or vice versa
  for (const [key, url] of logoMap.entries()) {
    if (!url) continue;
    if (normalized.includes(key) || key.includes(normalized)) {
      return url;
    }
  }

  return null;
};

