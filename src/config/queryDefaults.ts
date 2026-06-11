/** Shared React Query defaults — keeps list/detail hooks consistent. */
export const QUERY_STALE_TIME = 60_000;
export const QUERY_GC_TIME = 5 * 60_000;
export const STATIC_STALE_TIME = 30 * 60_000;

export const defaultQueryOptions = {
  staleTime: QUERY_STALE_TIME,
  gcTime: QUERY_GC_TIME,
  refetchOnWindowFocus: false as const,
  retry: 1,
};
