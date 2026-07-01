/**
 * UNIVERSAL QUERY HOOK WITH ERROR HANDLING
 * Use this everywhere instead of useQuery for built-in error handling
 */

import { useEffect } from 'react';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function useQueryError<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>,
): UseQueryResult<TData, TError> {
  const { toast } = useToast();

  const result = useQuery({
    ...options,
    retry: 1,
    refetchOnWindowFocus: false,
  } as UseQueryOptions<TData, TError>);

  useEffect(() => {
    if (result.isError && result.error) {
      const errorMsg = result.error instanceof Error
        ? result.error.message
        : String(result.error);
      if (!errorMsg.includes('abort') && !errorMsg.includes('WebSocket') && errorMsg.length > 0) {
        toast({
          title: 'Error Loading Data',
          description: errorMsg || 'An error occurred',
          variant: 'destructive',
        });
      }
    }
  }, [result.isError, result.error]);

  return result;
}
