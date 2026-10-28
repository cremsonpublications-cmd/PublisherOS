import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Re-fetch on window focus in production; disable in dev for less noise
      refetchOnWindowFocus: import.meta.env.PROD,
      // Stale time: 30 seconds — adjust per-query as needed
      staleTime: 30_000,
      retry: 1,
    },
  },
});
