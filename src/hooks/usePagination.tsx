import React, { useState, useCallback } from 'react';
import type { PaginationOptions, PaginatedResult } from '@/lib/utils/data';

interface UsePaginationOptions<T> {
  initialPage?: number;
  initialItemsPerPage?: number;
  itemsPerPageOptions?: number[];
}

interface UsePaginationReturn<T> {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  paginatedData: T[];
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  resetPagination: () => void;
  PaginationComponent: React.FC<{ data: T[]; totalItems?: number }>;
}

export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions<T> = {}
): UsePaginationReturn<T> {
  const {
    initialPage = 1,
    initialItemsPerPage = 12,
    itemsPerPageOptions = [6, 12, 24, 48]
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(initialPage);
    setItemsPerPage(initialItemsPerPage);
  }, [initialPage, initialItemsPerPage]);

  // Reset to page 1 when data length changes
  const handleDataChange = useCallback(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Auto-reset when data changes
  React.useEffect(() => {
    handleDataChange();
  }, [data.length, handleDataChange]);

  const PaginationComponent: React.FC<{ data: T[]; totalItems?: number }> = ({ 
    data: paginationData, 
    totalItems = data.length 
  }) => {
    const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (calculatedTotalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {Math.min(itemsPerPage, (currentPage - 1) * itemsPerPage + paginationData.length)} of {totalItems}
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border rounded text-sm"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>
                {option} per page
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {calculatedTotalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === calculatedTotalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedData,
    setCurrentPage: handlePageChange,
    setItemsPerPage: handleItemsPerPageChange,
    resetPagination,
    PaginationComponent
  };
}