import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import type { PublisherStatus, PublisherRole, AccountStatus } from '../../types';

const ROLE_LABELS: Record<PublisherRole, string> = {
  PUBLISHER_OWNER: 'Owner',
  PUBLISHER_STAFF: 'Staff',
};

const STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  PENDING_VERIFICATION: 'Pending',
};

export function PublisherDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'publisher', id],
    queryFn: async () => {
      const res = await superAdminApi.getPublisher(id);
      return res.publisher;
    },
    enabled: !!id,
  });

  const setStatus = useMutation({
    mutationFn: (status: PublisherStatus) => superAdminApi.setPublisherStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'publisher', id] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'publishers'] });
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

  const newStatus: PublisherStatus = data.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

  return (
    <div className="p-6 max-w-[960px]">
      <div className="mb-4">
        <Link
          to="/super-admin/publishers"
          className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          ← Publishers
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
            {data.name}
          </h1>
          <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5 font-mono">/{data.slug}</p>
        </div>
        <Button
          variant={data.status === 'ACTIVE' ? 'destructive' : 'secondary'}
          size="sm"
          loading={setStatus.isPending}
          onClick={() => setStatus.mutate(newStatus)}
        >
          {newStatus === 'SUSPENDED' ? 'Suspend Publisher' : 'Activate Publisher'}
        </Button>
      </div>

      {/* Publisher info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Status', value: data.status },
          { label: 'Website', value: data.website ?? '—' },
          { label: 'Description', value: data.description ?? '—' },
          { label: 'Created', value: new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
        ].map((row) => (
          <div key={row.label} className="border border-[hsl(var(--border))] rounded-[8px] p-4">
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mb-1">{row.label}</p>
            <p className="text-[13px] font-medium text-[hsl(var(--foreground))] truncate">{row.value}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-3">
        Users ({data.users.length})
      </h2>
      {data.users.length === 0 ? (
        <p className="text-[13px] text-[hsl(var(--muted-foreground))]">No users.</p>
      ) : (
        <div className="border border-[hsl(var(--border))] rounded-[8px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.5)]">
                <th className="text-left py-2.5 pl-5 pr-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Name</th>
                <th className="text-left py-2.5 px-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Email</th>
                <th className="text-left py-2.5 px-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Role</th>
                <th className="text-left py-2.5 px-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Status</th>
                <th className="text-right py-2.5 pr-5 pl-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-b border-[hsl(var(--border))] last:border-0">
                  <td className="py-3 pl-5 pr-4 text-[14px] font-medium text-[hsl(var(--foreground))]">{u.name}</td>
                  <td className="py-3 px-4 text-[13px] text-[hsl(var(--muted-foreground))]">{u.email}</td>
                  <td className="py-3 px-4 text-[13px] text-[hsl(var(--foreground))]">
                    {u.publisherRole ? ROLE_LABELS[u.publisherRole] : '—'}
                  </td>
                  <td className="py-3 px-4 text-[13px] text-[hsl(var(--muted-foreground))]">
                    {STATUS_LABELS[u.status]}
                  </td>
                  <td className="py-3 pr-5 pl-4 text-right text-[12px] text-[hsl(var(--muted-foreground))]">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
