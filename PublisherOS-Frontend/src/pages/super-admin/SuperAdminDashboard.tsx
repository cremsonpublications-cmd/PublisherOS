import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '../../lib/api';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';

export function SuperAdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'stats'],
    queryFn: async () => {
      const res = await superAdminApi.getStats();
      return res.stats;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Spinner size={20} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error">{(error as Error).message}</Alert>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 max-w-[960px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
          Platform Dashboard
        </h1>
        <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">
          Platform-wide statistics and activity.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Publishers', value: data.totalPublishers },
          { label: 'Active Publishers', value: data.activePublishers },
          { label: 'Suspended', value: data.suspendedPublishers },
          { label: 'Total Users', value: data.totalUsers },
        ].map((stat) => (
          <div key={stat.label} className="border border-[hsl(var(--border))] rounded-[8px] p-4">
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mb-1">{stat.label}</p>
            <p className="text-[24px] font-semibold text-[hsl(var(--foreground))] leading-tight">{stat.value}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
