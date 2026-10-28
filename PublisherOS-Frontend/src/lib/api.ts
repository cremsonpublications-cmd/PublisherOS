/**
 * Typed API client.
 *
 * - Always sends credentials (cookies) with every request.
 * - Throws ApiRequestError on non-2xx responses.
 * - Session cookies are HttpOnly — never accessible in JS.
 * - No tokens stored in localStorage or sessionStorage.
 */

import { config } from '../config';
import type { ApiError } from '../types';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiError['details'];

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // Always send session cookie
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let error: ApiError = { message: 'Request failed', code: 'UNKNOWN_ERROR' };
    try {
      const body = await res.json() as { error: ApiError };
      if (body?.error) error = body.error;
    } catch {
      // Response body was not valid JSON
    }
    throw new ApiRequestError(res.status, error);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: { publisherName: string; name: string; email: string; password: string }) =>
    request<{ message: string; user: import('../types').User }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  acceptInvitation: (token: string, data: { name: string; password: string }) =>
    request<{ message: string; user: import('../types').User }>('/api/v1/auth/accept-invitation', {
      method: 'POST',
      body: JSON.stringify({ token, ...data }),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: import('../types').User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    request<{ message: string }>('/api/v1/auth/logout', { method: 'POST' }),

  me: () =>
    request<{ user: import('../types').User }>('/api/v1/auth/me'),

  forgotPassword: (body: { email: string }) =>
    request<{ message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resetPassword: (body: { token: string; password: string }) =>
    request<{ message: string }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verifyEmail: (body: { otp: string; email: string }) =>
    request<{ message: string; user: import('../types').User }>('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resendVerification: () =>
    request<{ message: string }>('/api/v1/auth/resend-verification', {
      method: 'POST',
    }),
};

// ── Publisher endpoints ───────────────────────────────────────────────────────

export const publisherApi = {
  getMe: () =>
    request<{ publisher: import('../types').Publisher }>('/api/v1/publishers/me'),

  updateMe: (data: { name?: string; website?: string | null; description?: string | null }) =>
    request<{ publisher: import('../types').Publisher }>('/api/v1/publishers/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getStaff: () =>
    request<{ staff: import('../types').StaffMember[] }>('/api/v1/publishers/me/staff'),

  createStaff: (data: { name: string; email: string; password: string }) =>
    request<{ staff: import('../types').StaffMember }>('/api/v1/publishers/me/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeStaff: (userId: string) =>
    request<{ message: string }>(`/api/v1/publishers/me/staff/${userId}`, {
      method: 'DELETE',
    }),

  setCustomDomain: (domain: string) =>
    request<{ publisher: import('../types').Publisher }>('/api/v1/publishers/me/custom-domain', {
      method: 'PUT',
      body: JSON.stringify({ domain }),
    }),

  removeCustomDomain: () =>
    request<{ publisher: import('../types').Publisher }>('/api/v1/publishers/me/custom-domain', {
      method: 'DELETE',
    }),
};

// ── Super-admin endpoints ─────────────────────────────────────────────────────

export const superAdminApi = {
  getStats: () =>
    request<{ stats: import('../types').PlatformStats }>('/api/v1/super-admin/stats'),

  getPublishers: (page = 1) =>
    request<{
      publishers: Array<import('../types').Publisher & { _count: { users: number } }>;
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/v1/super-admin/publishers?page=${page}`),

  getPublisher: (id: string) =>
    request<{
      publisher: import('../types').Publisher & {
        users: Array<import('../types').StaffMember>;
      };
    }>(`/api/v1/super-admin/publishers/${id}`),

  setPublisherStatus: (id: string, status: import('../types').PublisherStatus) =>
    request<{ publisher: import('../types').Publisher }>(
      `/api/v1/super-admin/publishers/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    ),

  getUsers: (page = 1) =>
    request<{
      users: Array<import('../types').User & { publisher: { name: string } | null }>;
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/v1/super-admin/users?page=${page}`),

  setPublisherDomain: (id: string, domain: string | null) =>
    request<{ publisher: import('../types').Publisher }>(
      `/api/v1/super-admin/publishers/${id}/domain`,
      { method: 'PUT', body: JSON.stringify({ domain }) },
    ),

  getAuditEvents: (page = 1) =>
    request<{
      events: Array<
        import('../types').AuditEvent & {
          user: { name: string; email: string } | null;
          publisher: { name: string } | null;
        }
      >;
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/v1/super-admin/audit-events?page=${page}`),
};
