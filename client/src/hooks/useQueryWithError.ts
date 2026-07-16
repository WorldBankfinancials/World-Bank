/**
 * USEQUERY ERROR HANDLER WRAPPER
 * Standardized error handling for all useQuery calls
 */

import { useEffect } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function useQueryWithErrorHandling<TData = unknown>(
  options: UseQueryOptions<TData>,
) {
  const { toast } = useToast();

  const query = useQuery({
    ...options,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.error) {
      const rawMsg = query.error instanceof Error
        ? query.error.message
        : 'An error occurred while fetching data';
      // Only show safe, concise error messages to avoid leaking backend details
      const safeMessage = rawMsg.length > 100 ? 'An error occurred' : rawMsg;
      toast({
        title: 'Error',
        description: safeMessage,
        variant: 'destructive',
      });
    }
  }, [query.error]);

  return query;
}
