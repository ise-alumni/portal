// Common types used across the application

export type UserRole = 'Alum' | 'Staff' | 'Admin' ;

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
}

export interface PaginationResult<T> {
  items: T[];
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type SortOption<T> = {
  field: keyof T;
  direction: 'asc' | 'desc';
};

export type FilterOption<T> = {
  field: keyof T;
  value: unknown;
};
