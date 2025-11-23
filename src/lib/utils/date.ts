/**
 * Date formatting utilities
 */

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export const isDateInPast = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

export const isDateInFuture = (dateString: string): boolean => {
  return new Date(dateString) >= new Date();
};

export const isDateWithinLastDays = (dateString: string, days: number): boolean => {
  const date = new Date(dateString);
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date >= cutoffDate;
};