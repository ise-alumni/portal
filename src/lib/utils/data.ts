import { type Profile, type EventData, type Announcement } from '@/lib/types';

export interface FilterOptions {
  search?: string;
  tags?: string[];
  cohort?: number;
  userType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Generic filtering function
export function filterData<T>(
  data: T[],
  filters: FilterOptions,
  searchFields: (keyof T)[]
): T[] {
  return data.filter(item => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(searchLower);
      });
      if (!matchesSearch) return false;
    }

    // Tags filter (for events and announcements)
    if (filters.tags && filters.tags.length > 0) {
      const itemTags = (item as { tags?: unknown[] }).tags;
      if (!itemTags || !Array.isArray(itemTags)) return false;
      
      const hasMatchingTag = filters.tags.some(tag => 
        itemTags.some((itemTag: unknown) => 
          typeof itemTag === 'object' && itemTag !== null && 'name' in itemTag 
            ? (itemTag as { name: string }).name === tag 
            : itemTag === tag
        )
      );
      if (!hasMatchingTag) return false;
    }

    // Cohort filter (for profiles)
    if (filters.cohort !== undefined) {
      const itemCohort = (item as { cohort?: number }).cohort;
      if (itemCohort !== filters.cohort) return false;
    }

    // User type filter (for profiles)
    if (filters.userType) {
      const itemType = (item as { user_type?: string }).user_type;
      if (itemType !== filters.userType) return false;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const itemDate = new Date((item as { date?: string; created_at?: string }).date || (item as { created_at?: string }).created_at);
      if (filters.dateFrom && itemDate < filters.dateFrom) return false;
      if (filters.dateTo && itemDate > filters.dateTo) return false;
    }

    return true;
  });
}

// Generic sorting function
export function sortData<T>(data: T[], sortOption: SortOption): T[] {
  return [...data].sort((a, b) => {
    const aValue = a[sortOption.field as keyof T];
    const bValue = b[sortOption.field as keyof T];

    let comparison = 0;
    
    if (aValue === null || aValue === undefined) comparison = -1;
    else if (bValue === null || bValue === undefined) comparison = 1;
    else if (aValue < bValue) comparison = -1;
    else if (aValue > bValue) comparison = 1;

    return sortOption.direction === 'desc' ? -comparison : comparison;
  });
}

// Generic pagination function
export function paginateData<T>(
  data: T[],
  pagination: PaginationOptions
): PaginatedResult<T> {
  const { page, limit } = pagination;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedData = data.slice(startIndex, endIndex);
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: paginatedData,
    total: totalItems,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// Profile-specific utilities
export function filterProfiles(profiles: Profile[], filters: FilterOptions): Profile[] {
  return profiles.filter(item => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableFields = [
        item.full_name,
        item.bio,
        item.company,
        item.job_title,
        item.city,
        item.country,
        item.cohort?.toString(),
        item.professional_status,
      ];
      
      const matchesSearch = searchableFields.some(value => 
        value && String(value).toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // Tags filter (for events and announcements)
    if (filters.tags && filters.tags.length > 0) {
      const itemTags = (item as { tags?: unknown[] }).tags;
      if (!itemTags || !Array.isArray(itemTags)) return false;
      
      const hasMatchingTag = filters.tags.some(tag => 
        itemTags.some((itemTag: unknown) => 
          typeof itemTag === 'object' && itemTag !== null && 'name' in itemTag 
            ? (itemTag as { name: string }).name === tag 
            : itemTag === tag
        )
      );
      if (!hasMatchingTag) return false;
    }

    // Cohort filter (for profiles)
    if (filters.cohort !== undefined) {
      const itemCohort = (item as { cohort?: number }).cohort;
      if (itemCohort !== filters.cohort) return false;
    }

    // User type filter (for profiles)
    if (filters.userType) {
      const itemType = (item as { user_type?: string }).user_type;
      if (itemType !== filters.userType) return false;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const itemDate = new Date((item as { date?: string; created_at?: string }).date || (item as { created_at?: string }).created_at);
      if (filters.dateFrom && itemDate < filters.dateFrom) return false;
      if (filters.dateTo && itemDate > filters.dateTo) return false;
    }

    return true;
  });
}

export function sortProfiles(profiles: Profile[], sortOption: SortOption): Profile[] {
  return sortData(profiles, sortOption);
}

// Event-specific utilities
export function filterEvents(events: EventData[], filters: FilterOptions): EventData[] {
  return filterData(events, filters, ['title', 'description', 'location']);
}

export function sortEvents(events: EventData[], sortOption: SortOption): EventData[] {
  return sortData(events, sortOption);
}

// Announcement-specific utilities
export function filterAnnouncements(
  announcements: Announcement[],
  filters: FilterOptions
): Announcement[] {
  return filterData(announcements, filters, ['title', 'content']);
}

export function sortAnnouncements(
  announcements: Announcement[],
  sortOption: SortOption
): Announcement[] {
  return sortData(announcements, sortOption);
}

// Combined filter, sort, and paginate function
export function processData<T>(
  data: T[],
  filters: FilterOptions,
  sort: SortOption,
  pagination: PaginationOptions,
  searchFields: (keyof T)[]
): PaginatedResult<T> {
  const filtered = filterData(data, filters, searchFields);
  const sorted = sortData(filtered, sort);
  return paginateData(sorted, pagination);
}

// Search utilities
export function createSearchFilter(searchTerm: string): FilterOptions {
  return {
    search: searchTerm.trim() || undefined,
  };
}

// Tag utilities
export function createTagFilter(tags: string[]): FilterOptions {
  return {
    tags: tags.length > 0 ? tags : undefined,
  };
}

// Date range utilities
export function createDateRangeFilter(dateFrom?: Date, dateTo?: Date): FilterOptions {
  return {
    dateFrom,
    dateTo,
  };
}

// Default sort options
export const DEFAULT_SORT_OPTIONS = {
  profiles: { field: 'full_name', direction: 'asc' as const },
  events: { field: 'start_at', direction: 'desc' as const },
  announcements: { field: 'created_at', direction: 'desc' as const },
} as const;

// Default pagination
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 12,
} as const;