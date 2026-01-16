import { getEventTagColor } from '@/lib/constants';

/**
 * UI helper utilities for colors, labels, and styling
 */

export const getEventTagColorClass = (tagName: string): string => {
  const color = getEventTagColor(tagName);
  return `bg-[${color}] border-[${color}] text-white`;
};

export const getCohortLabel = (cohort: number | null): string | null => {
  if (cohort === null || cohort === undefined) return null;
  return `Cohort ${cohort}`;
};

export const getCohortBadgeClass = (cohort: number | null | undefined): string => {
  if (!cohort) return '';
  const index = ((cohort - 1) % 4 + 4) % 4;
  switch (index) {
    case 0:
      // Ravenclaw - dark blue
      return 'bg-slate-800 text-white';
    case 1:
      // Slytherin - green
      return 'bg-emerald-700 text-white';
    case 2:
      // Gryffindor - maroon
      return 'bg-red-800 text-white';
    case 3:
      // Hufflepuff - mustard
      return 'bg-amber-500 text-black';
    default:
      return '';
  }
};

