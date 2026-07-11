/**
 * QUERY CONFIGURATION DEFAULTS
 * Applied globally to all queries for consistent error handling
 */

export const QUERY_DEFAULTS = {
  retry: 1,
  refetchOnWindowFocus: false,
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 10, // 10 minutes (replaces cacheTime)
};

export const MUTATION_DEFAULTS = {
  retry: 1,
};
