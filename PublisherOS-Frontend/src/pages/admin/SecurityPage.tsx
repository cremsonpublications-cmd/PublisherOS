import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Button } from '../../components/ui/Button';

export function SecurityPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogoutAllSessions() {
    logout.mutate(undefined, {
      onSuccess: () => navigate('/login'),
    });
  }

  if (!user) return null;

  return (
    <div className="p-6 max-w-[640px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
          Security
        </h1>
        <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-1">
          Manage your active session.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Sessions section */}
        <section className="border border-[hsl(var(--border))] rounded-[8px] overflow-hidden">
          <div className="px-5 py-4 bg-[hsl(var(--muted)/.4)] border-b border-[hsl(var(--border))]">
            <h2 className="text-[14px] font-semibold text-[hsl(var(--foreground))]">Active session</h2>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5">
              Your current session in this browser.
            </p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-none" aria-hidden="true" />
              <span className="text-[13px] text-[hsl(var(--foreground))]">Current session — active now</span>
            </div>
            <p className="text-[13px] text-[hsl(var(--muted-foreground))] mb-4 leading-relaxed">
              Signing out revokes your current session immediately. If your
              account may be compromised, sign out here and reset your password.
            </p>
            <Button
              variant="destructive"
              size="sm"
              loading={logout.isPending}
              onClick={handleLogoutAllSessions}
            >
              Sign out of current session
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
