import { useState, useCallback, useMemo } from 'react';
import type { FilterOptions, SortOption } from '@/lib/utils/data';
import { filterData, sortData } from '@/lib/utils/data';

interface UseFilteringOptions<T> {
  initialFilters?: FilterOptions;
  initialSort?: SortOption;
  searchFields?: (keyof T)[];
}

interface UseFilteringReturn<T> {
  filters: FilterOptions;
  sort: SortOption;
  filteredData: T[];
  sortedData: T[];
  setFilters: (filters: FilterOptions) => void;
  setSort: (sort: SortOption) => void;
  updateFilter: (key: keyof FilterOptions, value: unknown) => void;
  clearFilters: () => void;
  resetToDefaults: () => void;
}

export function useFiltering<T>(
  data: T[],
  options: UseFilteringOptions<T> = {}
): UseFilteringReturn<T> {
  const {
    initialFilters = {},
    initialSort = { field: 'created_at', direction: 'desc' },
    searchFields = []
  } = options;

  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [sort, setSort] = useState<SortOption>(initialSort);

  const filteredData = useMemo(() => {
    return filterData(data, filters, searchFields);
  }, [data, filters, searchFields]);

  const sortedData = useMemo(() => {
    return sortData(filteredData, sort);
  }, [filteredData, sort]);

  const updateFilter = useCallback((key: keyof FilterOptions, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const resetToDefaults = useCallback(() => {
    setFilters(initialFilters);
    setSort(initialSort);
  }, [initialFilters, initialSort]);

  return {
    filters,
    sort,
    filteredData,
    sortedData,
    setFilters,
    setSort,
    updateFilter,
    clearFilters,
    resetToDefaults
  };
}