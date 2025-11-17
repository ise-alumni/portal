import { AnnouncementType } from '@/lib/types';

/**
 * UI helper utilities for colors, labels, and styling
 */

export const getAnnouncementTypeColor = (type: AnnouncementType): string => {
  switch (type) {
    case 'opportunity':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'news':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'lecture':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'program':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getAnnouncementTypeLabel = (type: AnnouncementType): string => {
  switch (type) {
    case 'opportunity':
      return 'Opportunity';
    case 'news':
      return 'News';
    case 'lecture':
      return 'Guest Lecture';
    case 'program':
      return 'Program';
    default:
      return type;
  }
};

export const getCohortLabel = (cohort: number | null): string | null => {
  if (!cohort) return null;
  return `Cohort ${cohort}`;
};