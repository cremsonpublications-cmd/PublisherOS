import React from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { usePublisher } from '../../hooks/usePublisher';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';

export function OverviewPage() {
  const { user } = useAuth();
  const { data: publisher, isLoading } = usePublisher();

  return (
    <div className="p-6 max-w-[960px]">
      {/* Title row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
            Overview
          </h1>
          {publisher && (
            <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">
              {publisher.name}
            </p>
          )}
        </div>
      </div>

      {/* Email verification notice */}
      {user && !user.emailVerifiedAt && (
        <div className="mb-6">
          <Alert variant="info" title="Verify your email">
            Check your inbox for a verification link. Your account has limited
            access until your email is verified.
          </Alert>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner size={20} />
        </div>
      )}

      {/* Publisher status cards */}
      {publisher && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-[hsl(var(--border))] rounded-[8px] p-4">
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mb-1">Publisher</p>
            <p className="text-[18px] font-semibold text-[hsl(var(--foreground))] leading-tight">{publisher.name}</p>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-1">/{publisher.slug}</p>
          </div>
          <div className="border border-[hsl(var(--border))] rounded-[8px] p-4">
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mb-1">Your role</p>
            <p className="text-[18px] font-semibold text-[hsl(var(--foreground))] capitalize leading-tight">
              {user?.publisherRole === 'PUBLISHER_OWNER' ? 'Owner' : 'Staff'}
            </p>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-1">Publisher role</p>
          </div>
          <div className="border border-[hsl(var(--border))] rounded-[8px] p-4">
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mb-1">Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full flex-none ${publisher.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-400'}`} />
              <p className="text-[18px] font-semibold text-[hsl(var(--foreground))] capitalize leading-tight">
                {publisher.status.charAt(0) + publisher.status.slice(1).toLowerCase()}
              </p>
            </div>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-1">Publisher status</p>
          </div>
        </div>
      )}

      {/* Phase notice */}
      <div className="border border-[hsl(var(--border))] rounded-[8px] p-5">
        <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-2">
          Platform foundation active
        </h2>
        <p className="text-[13px] text-[hsl(var(--muted-foreground))] leading-relaxed max-w-[600px]">
          Authentication, publisher management, and team management are running. Business
          modules — content, distribution, products, orders, and integrations —
          will be added in subsequent phases.
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Content', phase: 'Phase 3' },
            { label: 'Distribution', phase: 'Phase 3' },
            { label: 'Integrations', phase: 'Phase 4' },
            { label: 'Orders', phase: 'Phase 5' },
          ].map((item) => (
            <div key={item.label} className="rounded-[6px] bg-[hsl(var(--muted))] px-3 py-2.5">
              <p className="text-[13px] font-medium text-[hsl(var(--foreground)/.5)]">{item.label}</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{item.phase}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
