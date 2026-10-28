/**
 * Frontend configuration.
 *
 * VITE_ prefix is required for Vite to expose values to the browser bundle.
 * Only put non-sensitive values here — everything here is visible to users.
 */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
} as const;
