import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, ApiRequestError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';
import { Alert } from '../../components/ui/Alert';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
            Invalid link
          </h1>
        </div>
        <Alert variant="error">
          This reset link is invalid or has expired. Please request a new one.
        </Alert>
        <p className="mt-5 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
          <Link to="/forgot-password" className="font-medium text-[hsl(var(--foreground))] hover:underline">
            Request a new reset link
          </Link>
        </p>
      </>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
            Password updated
          </h1>
        </div>
        <Alert variant="success">
          Your password has been reset. Redirecting to sign in…
        </Alert>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
          New password
        </h1>
        <p className="mt-1 text-[14px] text-[hsl(var(--muted-foreground))]">
          Choose a strong password for your account.
        </p>
      </div>

      {error && (
        <div className="mb-5">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="New password" htmlFor="password" hint="Minimum 8 characters.">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-[12px] font-medium"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </FormField>

        <Button type="submit" loading={loading} className="w-full mt-1">
          Set new password
        </Button>
      </form>
    </>
  );
}
