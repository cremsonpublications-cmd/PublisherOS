import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';

export function UsersListPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['super-admin', 'users', page],
    queryFn: () => superAdminApi.getUsers(page),
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
          Users
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
                <th className="text-left py-2.5 px-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Email</th>
                <th className="text-left py-2.5 px-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">Publisher</th>
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
                    {u.publisher?.name ?? (u.systemRole === 'SUPER_ADMIN' ? 'Platform' : '—')}
                  </td>
                  <td className="py-3 px-4 text-[13px] text-[hsl(var(--foreground))]">
                    {u.systemRole === 'SUPER_ADMIN'
                      ? 'Super Admin'
                      : u.publisherRole === 'PUBLISHER_OWNER'
                      ? 'Owner'
                      : u.publisherRole === 'PUBLISHER_STAFF'
                      ? 'Staff'
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-[13px] text-[hsl(var(--muted-foreground))] capitalize">
                    {u.status.toLowerCase().replace('_', ' ')}
                  </td>
                  <td className="py-3 pr-5 pl-4 text-right text-[12px] text-[hsl(var(--muted-foreground))]">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
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
