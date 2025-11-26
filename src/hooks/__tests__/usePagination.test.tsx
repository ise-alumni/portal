import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  it('should initialize with default values', () => {
    const data = [1, 2, 3, 4, 5];
    const { result } = renderHook(() => usePagination(data));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.itemsPerPage).toBe(12);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedData).toEqual(data);
  });

  it('should calculate pagination correctly', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const { result } = renderHook(() => usePagination(data, {
      initialItemsPerPage: 3
    }));

    expect(result.current.totalPages).toBe(4);
    expect(result.current.paginatedData).toEqual([1, 2, 3]);
  });

  it('should handle page changes', () => {
    const data = Array.from({ length: 10 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(data, {
      initialItemsPerPage: 3
    }));

    act(() => {
      result.current.setCurrentPage(2);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedData).toEqual([4, 5, 6]);
  });

  it('should handle items per page changes', () => {
    const data = Array.from({ length: 10 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(data));

    act(() => {
      result.current.setItemsPerPage(5);
    });

    expect(result.current.itemsPerPage).toBe(5);
    expect(result.current.currentPage).toBe(1); // Should reset to page 1
    expect(result.current.totalPages).toBe(2);
  });

  it('should handle boundary conditions', () => {
    const data = [1, 2, 3];
    const { result } = renderHook(() => usePagination(data, {
      initialItemsPerPage: 2
    }));

    // Test going beyond boundaries
    act(() => {
      result.current.setCurrentPage(0);
    });
    expect(result.current.currentPage).toBe(1);

    act(() => {
      result.current.setCurrentPage(10);
    });
    expect(result.current.currentPage).toBe(2); // Max page
  });

  it('should reset pagination', () => {
    const data = [1, 2, 3, 4, 5];
    const { result } = renderHook(() => usePagination(data, {
      initialPage: 3,
      initialItemsPerPage: 2
    }));

    act(() => {
      result.current.setCurrentPage(2);
      result.current.setItemsPerPage(3);
    });

    act(() => {
      result.current.resetPagination();
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.itemsPerPage).toBe(2);
  });
});