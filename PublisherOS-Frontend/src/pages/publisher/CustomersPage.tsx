import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { publisherApi } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import type { AccountStatus } from '../../types';

const STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  PENDING_VERIFICATION: 'Pending',
};

export function CustomersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['publisher', 'customers'],
    queryFn: () => publisherApi.getCustomers(),
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">Customers</h1>
        {data && (
          <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {data.customers.length} registered
          </p>
        )}
      </div>

      {error && <div className="mb-5"><Alert variant="error">{(error as Error).message}</Alert></div>}

      {isLoading && <div className="flex justify-center py-8"><Spinner size={20} /></div>}

      {!isLoading && data && data.customers.length === 0 && (
        <div className="border border-[hsl(var(--border))] rounded-[8px] p-8 text-center">
          <p className="text-[14px] text-[hsl(var(--muted-foreground))]">No customers yet.</p>
          <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-1">
            Customers who sign up on your public site will appear here.
          </p>
        </div>
      )}

      {!isLoading && data && data.customers.length > 0 && (
        <div className="border border-[hsl(var(--border))] rounded-[8px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.5)]">
                <th className="text-left py-2.5 pl-5 pr-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Name</th>
                <th className="text-left py-2.5 px-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Email</th>
                <th className="text-left py-2.5 px-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Status</th>
                <th className="text-right py-2.5 pr-5 pl-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.map((c) => (
                <tr key={c.id} className="border-b border-[hsl(var(--border))] last:border-0">
                  <td className="py-3 pl-5 pr-4 text-[14px] font-medium text-[hsl(var(--foreground))]">{c.name}</td>
                  <td className="py-3 px-4 text-[13px] text-[hsl(var(--muted-foreground))]">{c.email}</td>
                  <td className="py-3 px-4 text-[13px] text-[hsl(var(--muted-foreground))]">{STATUS_LABELS[c.status]}</td>
                  <td className="py-3 pr-5 pl-4 text-right text-[12px] text-[hsl(var(--muted-foreground))]">
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
