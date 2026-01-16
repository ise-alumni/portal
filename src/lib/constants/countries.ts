/**
 * Country list using i18n-iso-countries package
 */

import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

// Register English locale
countries.registerLocale(enLocale);

// Get all country names in English, sorted alphabetically
const countryNames = countries.getNames('en', { select: 'official' });
export const COUNTRIES = Object.values(countryNames).sort() as string[];

export type Country = typeof COUNTRIES[number];

export const getCountryName = (code: string): string | undefined => {
  return countries.getName(code, 'en');
};

