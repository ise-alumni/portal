import { getAnnouncementTypesSync, getEventTagColor } from '@/lib/constants';

/**
 * UI helper utilities for colors, labels, and styling
 */

export const getAnnouncementTypeColor = (type: string): string => {
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

export const getAnnouncementTypeLabel = (type: string): string => {
  // Use dynamic types from database
  const types = getAnnouncementTypesSync();
  if (types.includes(type)) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  
  // Fallback for known types
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

export const getEventTagColorClass = (tagName: string): string => {
  const color = getEventTagColor(tagName);
  // Convert hex color to Tailwind classes (simplified approach)
  switch (color) {
    case '#10b981': return 'bg-green-100 text-green-800 border-green-200';
    case '#f59e0b': return 'bg-amber-100 text-amber-800 border-amber-200';
    case '#ef4444': return 'bg-red-100 text-red-800 border-red-200';
    case '#8b5cf6': return 'bg-purple-100 text-purple-800 border-purple-200';
    case '#06b6d4': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case '#84cc16': return 'bg-lime-100 text-lime-800 border-lime-200';
    case '#6366f1': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case '#f97316': return 'bg-orange-100 text-orange-800 border-orange-200';
    case '#ec4899': return 'bg-pink-100 text-pink-800 border-pink-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getCohortLabel = (cohort: number | null): string | null => {
  if (cohort === null || cohort === undefined) return null;
  return `Cohort ${cohort}`;
};