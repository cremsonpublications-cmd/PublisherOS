import React, { useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { authApi, ApiRequestError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export function ProfilePage() {
  const { user } = useAuth();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  async function handleResendVerification() {
    setResendLoading(true);
    setResendMessage(null);
    setResendError(null);
    try {
      await authApi.resendVerification();
      setResendMessage('Verification email sent. Check your inbox.');
    } catch (err) {
      setResendError(
        err instanceof ApiRequestError ? err.message : 'Failed to send email.',
      );
    } finally {
      setResendLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="p-6 max-w-[640px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
          Profile
        </h1>
        <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-1">
          Your account information.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Account info */}
        <section className="border border-[hsl(var(--border))] rounded-[8px] overflow-hidden">
          <div className="px-5 py-4 bg-[hsl(var(--muted)/.4)] border-b border-[hsl(var(--border))]">
            <h2 className="text-[14px] font-semibold text-[hsl(var(--foreground))]">Account details</h2>
          </div>
          <div className="divide-y divide-[hsl(var(--border))]">
            {[
              { label: 'Name', value: user.name },
              { label: 'Email', value: user.email },
              {
                label: 'Account status',
                value: user.status === 'ACTIVE'
                  ? 'Active'
                  : user.status === 'PENDING_VERIFICATION'
                  ? 'Pending email verification'
                  : 'Suspended',
              },
              {
                label: 'Email verified',
                value: user.emailVerifiedAt
                  ? new Date(user.emailVerifiedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Not verified',
              },
              {
                label: 'Member since',
                value: user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—',
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center px-5 py-3">
                <span className="text-[13px] text-[hsl(var(--muted-foreground))]">{row.label}</span>
                <span className="text-[13px] font-medium text-[hsl(var(--foreground))]">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Email verification */}
        {!user.emailVerifiedAt && (
          <section className="border border-[hsl(var(--border))] rounded-[8px] p-5">
            <h2 className="text-[14px] font-semibold text-[hsl(var(--foreground))] mb-2">
              Verify your email
            </h2>
            <p className="text-[13px] text-[hsl(var(--muted-foreground))] mb-4 leading-relaxed">
              Your email address hasn't been verified yet. Check your inbox for
              the verification link, or request a new one.
            </p>

            {resendMessage && (
              <div className="mb-4">
                <Alert variant="success">{resendMessage}</Alert>
              </div>
            )}
            {resendError && (
              <div className="mb-4">
                <Alert variant="error">{resendError}</Alert>
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              loading={resendLoading}
              onClick={handleResendVerification}
            >
              Resend verification email
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
