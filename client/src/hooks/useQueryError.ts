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
      const rawMsg = result.error instanceof Error
        ? result.error.message
        : String(result.error);
      if (!rawMsg.includes('abort') && !rawMsg.includes('WebSocket') && rawMsg.length > 0) {
        // Only show safe, concise error messages to avoid leaking backend details
        const safeMessage = rawMsg.length > 100 ? 'An error occurred' : rawMsg;
        toast({
          title: 'Error Loading Data',
          description: safeMessage || 'An error occurred',
          variant: 'destructive',
        });
      }
    }
  }, [result.isError, result.error]);

  return result;
}
