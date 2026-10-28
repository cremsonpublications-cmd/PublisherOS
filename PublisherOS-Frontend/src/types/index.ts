// Shared TypeScript types for API responses.
// These mirror the backend response shapes — keep them in sync.

export type SystemRole = 'SUPER_ADMIN';
export type PublisherRole = 'PUBLISHER_OWNER' | 'PUBLISHER_STAFF';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
export type PublisherStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  status: AccountStatus;
  emailVerifiedAt: string | null;
  systemRole: SystemRole | null;
  publisherRole: PublisherRole | null;
  publisherId: string | null;
  createdAt: string;
}

export interface Publisher {
  id: string;
  name: string;
  slug: string;
  status: PublisherStatus;
  website: string | null;
  description: string | null;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  publisherRole: PublisherRole;
  status: AccountStatus;
  createdAt: string;
}


export interface AuditEvent {
  id: string;
  userId: string | null;
  publisherId: string | null;
  event: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface PlatformStats {
  totalPublishers: number;
  activePublishers: number;
  suspendedPublishers: number;
  totalUsers: number;
  recentLoginEvents: AuditEvent[];
  recentFailedLogins: AuditEvent[];
}

// API error shape
export interface ApiError {
  message: string;
  code: string;
  details?: Array<{ path: string; message: string }>;
}
