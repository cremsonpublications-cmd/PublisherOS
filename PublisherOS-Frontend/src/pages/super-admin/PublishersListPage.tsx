import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi, ApiRequestError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import type { Publisher, PublisherStatus } from '../../types';

type PublisherWithCount = Publisher & { _count: { users: number } };

function StatusBadge({ status }: { status: PublisherStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium ${
      status === 'ACTIVE'
        ? 'bg-[hsl(142_76%_36%/.1)] text-[hsl(142_76%_26%)]'
        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-green-500' : 'bg-[hsl(var(--muted-foreground))]'}`} />
      {status === 'ACTIVE' ? 'Active' : 'Suspended'}
    </span>
  );
}

function PublisherRow({ publisher }: { publisher: PublisherWithCount }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const setStatus = useMutation({
    mutationFn: (status: PublisherStatus) => superAdminApi.setPublisherStatus(publisher.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'publishers'] });
    },
    onError: (err) => {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update status.');
    },
  });

  const newStatus: PublisherStatus = publisher.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

  return (
    <tr className="border-b border-[hsl(var(--border))] last:border-0">
      <td className="py-3 pl-5 pr-4">
        <Link
          to={`/super-admin/publishers/${publisher.id}`}
          className="font-medium text-[14px] text-[hsl(var(--foreground))] hover:underline"
        >
          {publisher.name}
        </Link>
        <p className="text-[12px] text-[hsl(var(--muted-foreground))] font-mono">/{publisher.slug}</p>
        {error && <p className="text-[12px] text-[hsl(var(--destructive))] mt-1">{error}</p>}
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={publisher.status} />
      </td>
      <td className="py-3 px-4 text-[13px] text-[hsl(var(--foreground))]">
        {publisher._count.users}
      </td>
      <td className="py-3 px-4 text-[13px] text-[hsl(var(--muted-foreground))]">
        {new Date(publisher.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>
      <td className="py-3 pr-5 pl-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/super-admin/publishers/${publisher.id}`}
            className="inline-flex items-center h-8 px-3 rounded-[6px] text-[13px] font-medium border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
          >
            View
          </Link>
          <Button
            variant="secondary"
            size="sm"
            loading={setStatus.isPending}
            onClick={() => setStatus.mutate(newStatus)}
          >
            {newStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function PublishersListPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'publishers', page],
    queryFn: () => superAdminApi.getPublishers(page),
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
          Publishers
        </h1>
        {data && (
          <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {data.total} total
          </p>
        )}
      </div>

      {error && (
        <div className="mb-5">
          <Alert variant="error">{(error as Error).message}</Alert>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner size={20} />
        </div>
      )}

      {!isLoading && data && (
        <div className="border border-[hsl(var(--border))] rounded-[8px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.5)]">
                <th className="text-left py-2.5 pl-5 pr-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Name</th>
                <th className="text-left py-2.5 px-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Status</th>
                <th className="text-left py-2.5 px-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Users</th>
                <th className="text-left py-2.5 px-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Created</th>
                <th className="text-right py-2.5 pr-5 pl-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.publishers.map((p) => (
                <PublisherRow key={p.id} publisher={p} />
              ))}
            </tbody>
          </table>

          {data.total > data.pageSize && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)]">
              <span className="text-[12px] text-[hsl(var(--muted-foreground))]">
                {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="secondary" size="sm" disabled={page * data.pageSize >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
