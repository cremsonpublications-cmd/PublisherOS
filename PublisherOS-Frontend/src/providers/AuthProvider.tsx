/**
 * AuthProvider — centralized authentication state.
 *
 * Uses TanStack Query for server-state. The session cookie is HttpOnly,
 * so the only way to know if a user is logged in is to call /api/v1/auth/me.
 *
 * On mount (and on refocus in prod), calls /me once and caches the result.
 * Mutations (login, logout, register) invalidate and refetch the /me query.
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { authApi, ApiRequestError } from '../lib/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isPublisherOwner: boolean;
  isPublisherStaff: boolean;
  login: UseMutationResult<
    { user: User },
    Error,
    { email: string; password: string }
  >;
  logout: UseMutationResult<{ message: string }, Error, void>;
  register: UseMutationResult<
    { message: string; user: User },
    Error,
    { publisherName: string; name: string; email: string; password: string }
  >;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ME_QUERY_KEY = ['auth', 'me'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      const data = await authApi.me();
      return data.user;
    },
    retry: (failureCount, error) => {
      // Don't retry 401 — user is genuinely not logged in
      if (error instanceof ApiRequestError && error.status === 401) return false;
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: import.meta.env.PROD,
  });

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(ME_QUERY_KEY, data.user);
    },
  });

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.setQueryData(ME_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: ['publisher'] });
    },
  });

  const register = useMutation({
    mutationFn: authApi.register,
  });

  const user = meQuery.data ?? null;
  // isLoading is true only on the first load (no cached data yet)
  const isLoading = meQuery.isPending;
  const isAuthenticated = user !== null;
  const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN';
  const isPublisherOwner = user?.publisherRole === 'PUBLISHER_OWNER';
  const isPublisherStaff = user?.publisherRole === 'PUBLISHER_STAFF';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isSuperAdmin,
        isPublisherOwner,
        isPublisherStaff,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
