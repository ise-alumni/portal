import { useState, useEffect, useCallback } from 'react';
import { log } from '@/lib/utils/logger';

interface UseDataFetchingOptions<T> {
  initialData?: T[];
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
}

interface UseDataFetchingReturn<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useDataFetching<T>(
  fetchFunction: () => Promise<T[]>,
  options: UseDataFetchingOptions<T> = {}
): UseDataFetchingReturn<T> {
  const {
    initialData = null,
    onSuccess,
    onError,
    retryCount = 3
  } = options;

  const [data, setData] = useState<T[] | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentRetry, setCurrentRetry] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFunction();
      setData(result);
      setCurrentRetry(0);
      
      onSuccess?.(result);
      log.debug('Data fetched successfully:', result.length, 'items');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      
      // Auto-retry logic
      if (currentRetry < retryCount) {
        setCurrentRetry(prev => prev + 1);
        log.warn(`Retrying fetch (${currentRetry + 1}/${retryCount}):`, error);
        setTimeout(() => fetchData(), 1000 * (currentRetry + 1)); // Exponential backoff
      } else {
        onError?.(error);
        log.error('Failed to fetch data after retries:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, currentRetry, retryCount, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setCurrentRetry(0);
    setLoading(false);
  }, [initialData]);

  // Initial fetch
  useEffect(() => {
    if (data === null) {
      fetchData();
    }
  }, [fetchData, data]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    reset
  };
}