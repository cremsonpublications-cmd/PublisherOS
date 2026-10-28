import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';
import { Alert } from '../../components/ui/Alert';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () => navigate(from, { replace: true }),
      },
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
          Sign in
        </h1>
        <p className="mt-1 text-[14px] text-[hsl(var(--muted-foreground))]">
          Enter your credentials to access your account.
        </p>
      </div>

      {login.error && (
        <div className="mb-5">
          <Alert variant="error">{login.error.message}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={login.isPending}
          />
        </FormField>

        <FormField label="Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={login.isPending}
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

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={login.isPending} className="w-full mt-1">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-medium text-[hsl(var(--foreground))] hover:underline"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
