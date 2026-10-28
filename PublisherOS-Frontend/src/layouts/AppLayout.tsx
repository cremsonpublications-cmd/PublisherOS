import React, { useState, Suspense } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { usePublisher } from '../hooks/usePublisher';
import { Spinner } from '../components/ui/Spinner';

// ── Icon components ────────────────────────────────────────────────────────────

function OverviewIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="8.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="8.5" width="5" height="5" rx="1" />
      <rect x="8.5" y="8.5" width="5" height="5" rx="1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="2" />
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.6 2.6l1.1 1.1M11.3 11.3l1.1 1.1M11.3 3.7l-1.1 1.1M3.7 11.3l-1.1 1.1" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="5.5" cy="5" r="2.5" />
      <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
      <circle cx="11.5" cy="5" r="2" />
      <path d="M11.5 9c1.5 0 2.5 1 2.5 2.5" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="7.5" cy="5" r="3" />
      <path d="M2 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  );
}

function DomainIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="6" />
      <path d="M7.5 1.5c-2 2-3 3.8-3 6s1 4 3 6M7.5 1.5c2 2 3 3.8 3 6s-1 4-3 6M1.5 7.5h12" />
    </svg>
  );
}


function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5" />
      <path d="M9.5 10L13 7l-3.5-3" />
      <line x1="5" y1="7" x2="13" y2="7" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2 4.5h14M2 9h14M2 13.5h14" />
    </svg>
  );
}

// ── Nav link item ─────────────────────────────────────────────────────────────

function SidebarNavItem({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ComponentType;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-2.5 py-[7px] rounded-[6px] text-[14px] transition-colors ${
          isActive
            ? 'bg-[hsl(220_10%_91%)] text-[hsl(var(--foreground))] font-medium'
            : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
        }`
      }
    >
      <Icon />
      {label}
    </NavLink>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

export function AppLayout() {
  const { user, logout, isSuperAdmin, isPublisherOwner } = useAuth();
  const navigate = useNavigate();
  const { data: publisher } = usePublisher();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Super admins should not be in AppLayout
  if (isSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }

  const ownerNavItems = [
    { to: '/dashboard', label: 'Overview', icon: OverviewIcon },
    { to: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
    { to: '/dashboard/team', label: 'Team', icon: TeamIcon },
    { to: '/dashboard/domain', label: 'Domain', icon: DomainIcon },
  ] as const;

  const staffNavItems = [
    { to: '/dashboard', label: 'Overview', icon: OverviewIcon },
  ] as const;

  const accountNavItems = [
    { to: '/dashboard/profile', label: 'Profile', icon: ProfileIcon },
  ] as const;

  const mainNavItems = isPublisherOwner ? ownerNavItems : staffNavItems;

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => navigate('/login'),
    });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Product mark + publisher name */}
      <div className="px-3 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-[5px] bg-[hsl(var(--primary))] flex items-center justify-center text-white text-[11px] font-semibold flex-none">
            P
          </span>
          <span className="text-[14px] font-semibold text-[hsl(var(--foreground))] tracking-tight truncate">
            {publisher ? publisher.name : 'PublisherOS'}
          </span>
        </div>
      </div>

      <div className="px-1.5 flex-none h-px bg-[hsl(var(--border))] mx-3" />

      {/* Main navigation */}
      <nav className="flex-1 px-3 pt-3 overflow-y-auto" aria-label="Main navigation">
        <div className="flex flex-col gap-0.5">
          {mainNavItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </div>

        {/* Account section */}
        <div className="mt-5 mb-1">
          <p className="px-2.5 text-[11px] text-[hsl(var(--muted-foreground))] font-medium mb-1">
            Account
          </p>
          <div className="flex flex-col gap-0.5">
            {accountNavItems.map((item) => (
              <SidebarNavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User row at bottom */}
      <div className="px-3 pb-3 pt-2">
        <div className="h-px bg-[hsl(var(--border))] mb-3" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[11px] font-semibold text-[hsl(var(--muted-foreground))] flex-none">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[hsl(var(--foreground))] truncate leading-tight">
              {user?.name}
            </p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate leading-tight">
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] flex-none border-r border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        {sidebarContent}
      </aside>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-[hsl(var(--background))] z-50 flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-12 flex items-center border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 flex-none">
          <button
            className="md:hidden mr-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </button>
          <div className="md:hidden flex items-center gap-2 flex-1">
            <span className="w-6 h-6 rounded-[4px] bg-[hsl(var(--primary))] flex items-center justify-center text-white text-[10px] font-semibold">P</span>
            <span className="text-[13px] font-semibold text-[hsl(var(--foreground))]">PublisherOS</span>
          </div>
          <div className="hidden md:block flex-1" />
          {user && !user.emailVerifiedAt && (
            <div className="hidden md:flex items-center gap-2 text-[12px] text-[hsl(var(--muted-foreground))]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-none" />
              <span>Email not verified</span>
            </div>
          )}
        </header>

        {/* Page canvas */}
        <main className="flex-1 md:m-2 md:rounded-[8px] md:border md:border-[hsl(var(--border))] bg-white overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-32">
                <Spinner size={20} />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
