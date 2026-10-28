import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publisherApi, ApiRequestError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../providers/AuthProvider';
import type { StaffMember, AccountStatus } from '../../types';

const STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  PENDING_VERIFICATION: 'Pending',
};

function StatusDot({ status }: { status: AccountStatus }) {
  const colorMap: Record<AccountStatus, string> = {
    ACTIVE: 'bg-green-500',
    SUSPENDED: 'bg-[hsl(var(--muted-foreground))]',
    PENDING_VERIFICATION: 'bg-amber-400',
  };
  return (
    <span className={`w-1.5 h-1.5 rounded-full flex-none ${colorMap[status]}`} aria-hidden="true" />
  );
}

// ── Add Staff Modal ───────────────────────────────────────────────────────────

function AddStaffModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      publisherApi.createStaff(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publisher', 'staff'] });
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to create staff account.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    create.mutate({ name, email, password });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white border border-[hsl(var(--border))] rounded-[8px] shadow-lg w-full max-w-[400px] p-6">
        <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))] mb-4">
          Add staff member
        </h2>

        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FormField label="Full name" htmlFor="staff-name">
            <Input
              id="staff-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
              disabled={create.isPending}
            />
          </FormField>

          <FormField label="Email address" htmlFor="staff-email">
            <Input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
              disabled={create.isPending}
            />
          </FormField>

          <FormField label="Password" htmlFor="staff-password">
            <div className="relative">
              <Input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                disabled={create.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </FormField>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={onClose} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Staff row ─────────────────────────────────────────────────────────────────

function StaffRow({ member }: { member: StaffMember }) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const remove = useMutation({
    mutationFn: () => publisherApi.removeStaff(member.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publisher', 'staff'] });
      setConfirming(false);
    },
  });

  return (
    <tr className="border-b border-[hsl(var(--border))] last:border-0">
      <td className="py-3 pl-5 pr-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[11px] font-semibold text-[hsl(var(--muted-foreground))] flex-none">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-[hsl(var(--foreground))] truncate leading-tight">{member.name}</p>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] truncate leading-tight">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <StatusDot status={member.status} />
          <span className="text-[13px] text-[hsl(var(--muted-foreground))]">{STATUS_LABELS[member.status]}</span>
        </div>
      </td>
      <td className="py-3 pr-5 pl-4 text-right">
        {confirming ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Remove?</span>
            <Button
              variant="destructive"
              size="sm"
              loading={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Yes
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={remove.isPending}
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(true)}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
          >
            Remove
          </Button>
        )}
      </td>
    </tr>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function TeamPage() {
  const { user } = useAuth();
  const [addStaffOpen, setAddStaffOpen] = useState(false);

  const { data: staff = [], isLoading, error } = useQuery({
    queryKey: ['publisher', 'staff'],
    queryFn: async () => {
      const data = await publisherApi.getStaff();
      return data.staff;
    },
  });

  const isOwner = user?.publisherRole === 'PUBLISHER_OWNER';

  return (
    <div className="p-6">
      {addStaffOpen && <AddStaffModal onClose={() => setAddStaffOpen(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
            Team
          </h1>
          {!isLoading && (
            <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">
              {staff.length} {staff.length === 1 ? 'staff member' : 'staff members'}
            </p>
          )}
        </div>
        {isOwner && (
          <Button onClick={() => setAddStaffOpen(true)}>
            Add staff
          </Button>
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

      {!isLoading && staff.length === 0 && (
        <div className="border border-dashed border-[hsl(var(--border))] rounded-[8px] p-8 text-center">
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mb-4">
            No staff members yet.
          </p>
          {isOwner && (
            <Button variant="secondary" size="sm" onClick={() => setAddStaffOpen(true)}>
              Add your first team member
            </Button>
          )}
        </div>
      )}

      {!isLoading && staff.length > 0 && (
        <div className="border border-[hsl(var(--border))] rounded-[8px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.5)]">
                <th className="text-left py-2.5 pl-5 pr-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">
                  Member
                </th>
                <th className="text-left py-2.5 px-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">
                  Status
                </th>
                {isOwner && (
                  <th className="text-right py-2.5 pr-5 pl-4 text-[12px] text-[hsl(var(--muted-foreground))] font-medium">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <StaffRow key={member.id} member={member} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
