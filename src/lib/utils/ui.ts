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
