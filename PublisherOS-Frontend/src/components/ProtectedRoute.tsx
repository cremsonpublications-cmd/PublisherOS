import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { Spinner } from './ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'SUPER_ADMIN' | 'PUBLISHER_OWNER' | 'any';
}

/**
 * Redirect unauthenticated users to /login, preserving the intended destination.
 * Also redirects users to the correct area based on their role.
 * The backend is the real security boundary — this only prevents rendering.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <Spinner size={24} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // SUPER_ADMIN on a publisher-only route → redirect to super-admin area
  if (requiredRole === 'PUBLISHER_OWNER' && user?.systemRole === 'SUPER_ADMIN') {
    return <Navigate to="/super-admin" replace />;
  }

  // Publisher user on a super-admin route → redirect to dashboard
  if (requiredRole === 'SUPER_ADMIN' && user?.systemRole !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  // PUBLISHER_STAFF on owner-only route → redirect to dashboard
  if (requiredRole === 'PUBLISHER_OWNER' && user?.publisherRole !== 'PUBLISHER_OWNER') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
