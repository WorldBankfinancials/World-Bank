/**
 * USEQUERY ERROR HANDLER WRAPPER
 * Standardized error handling for all useQuery calls
 */

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

  // Handle errors consistently
  if (query.error) {
    const errorMessage = query.error instanceof Error 
      ? query.error.message 
      : 'An error occurred while fetching data';
    
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  }

  return query;
}
