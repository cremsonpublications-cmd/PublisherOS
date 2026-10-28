import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { Spinner } from './components/ui/Spinner';

// Lazy-load route components to keep the initial bundle small
const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

// Auth pages
const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/auth/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const VerifyEmailPage = lazy(() =>
  import('./pages/auth/VerifyEmailPage').then((m) => ({
    default: m.VerifyEmailPage,
  })),
);

// Publisher dashboard pages
const OverviewPage = lazy(() =>
  import('./pages/admin/OverviewPage').then((m) => ({ default: m.OverviewPage })),
);
const PublisherSettingsPage = lazy(() =>
  import('./pages/publisher/PublisherSettingsPage').then((m) => ({
    default: m.PublisherSettingsPage,
  })),
);
const DomainSettingsPage = lazy(() =>
  import('./pages/publisher/DomainSettingsPage').then((m) => ({
    default: m.DomainSettingsPage,
  })),
);
const TeamPage = lazy(() =>
  import('./pages/admin/TeamPage').then((m) => ({ default: m.TeamPage })),
);
const ProfilePage = lazy(() =>
  import('./pages/admin/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);

// Super-admin pages
const SuperAdminDashboard = lazy(() =>
  import('./pages/super-admin/SuperAdminDashboard').then((m) => ({
    default: m.SuperAdminDashboard,
  })),
);
const PublishersListPage = lazy(() =>
  import('./pages/super-admin/PublishersListPage').then((m) => ({
    default: m.PublishersListPage,
  })),
);
const PublisherDetailPage = lazy(() =>
  import('./pages/super-admin/PublisherDetailPage').then((m) => ({
    default: m.PublisherDetailPage,
  })),
);
const UsersListPage = lazy(() =>
  import('./pages/super-admin/UsersListPage').then((m) => ({
    default: m.UsersListPage,
  })),
);
const AuditLogPage = lazy(() =>
  import('./pages/super-admin/AuditLogPage').then((m) => ({
    default: m.AuditLogPage,
  })),
);

function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--background))]">
          <Spinner size={24} />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public marketing page */}
        <Route
          path="/"
          element={
            <PageSuspense>
              <HomePage />
            </PageSuspense>
          }
        />

        {/* Auth routes — centered card layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<PageSuspense><LoginPage /></PageSuspense>} />
          <Route path="/register" element={<PageSuspense><RegisterPage /></PageSuspense>} />
          <Route path="/forgot-password" element={<PageSuspense><ForgotPasswordPage /></PageSuspense>} />
          <Route path="/reset-password" element={<PageSuspense><ResetPasswordPage /></PageSuspense>} />
          <Route path="/verify-email" element={<PageSuspense><VerifyEmailPage /></PageSuspense>} />
        </Route>

        {/* Publisher dashboard routes — any publisher role */}
        <Route
          element={
            <ProtectedRoute requiredRole="any">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<PageSuspense><OverviewPage /></PageSuspense>} />
          <Route path="/dashboard/profile" element={<PageSuspense><ProfilePage /></PageSuspense>} />
        </Route>

        {/* Publisher dashboard routes — PUBLISHER_OWNER only */}
        <Route
          element={
            <ProtectedRoute requiredRole="PUBLISHER_OWNER">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard/settings" element={<PageSuspense><PublisherSettingsPage /></PageSuspense>} />
          <Route path="/dashboard/team" element={<PageSuspense><TeamPage /></PageSuspense>} />
          <Route path="/dashboard/domain" element={<PageSuspense><DomainSettingsPage /></PageSuspense>} />
        </Route>

        {/* Super-admin routes */}
        <Route
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/super-admin" element={<PageSuspense><SuperAdminDashboard /></PageSuspense>} />
          <Route path="/super-admin/publishers" element={<PageSuspense><PublishersListPage /></PageSuspense>} />
          <Route path="/super-admin/publishers/:id" element={<PageSuspense><PublisherDetailPage /></PageSuspense>} />
          <Route path="/super-admin/users" element={<PageSuspense><UsersListPage /></PageSuspense>} />
          <Route path="/super-admin/audit-log" element={<PageSuspense><AuditLogPage /></PageSuspense>} />
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={
            <PageSuspense>
              <NotFoundPage />
            </PageSuspense>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
