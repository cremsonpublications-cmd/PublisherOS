import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';
import { Alert } from '../../components/ui/Alert';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [publisherName, setPublisherName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    register.mutate(
      { publisherName, name, email, password },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => navigate('/verify-email', { state: { email } }), 1500);
        },
      },
    );
  }

  if (success) {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
            Check your email
          </h1>
        </div>
        <Alert variant="success">
          Account created. We've sent a 6-digit verification code to{' '}
          <strong>{email}</strong>. Redirecting…
        </Alert>
        <p className="mt-5 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
          <Link to="/login" className="font-medium text-[hsl(var(--foreground))] hover:underline">
            Back to sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
          Create a publisher account
        </h1>
        <p className="mt-1 text-[14px] text-[hsl(var(--muted-foreground))]">
          Set up your publishing organization on PublisherOS.
        </p>
      </div>

      {register.error && (
        <div className="mb-5">
          <Alert variant="error">{register.error.message}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="Publisher name" htmlFor="publisher-name" hint="The name of your publishing organization.">
          <Input
            id="publisher-name"
            type="text"
            value={publisherName}
            onChange={(e) => setPublisherName(e.target.value)}
            placeholder="Acme Publishing"
            autoComplete="organization"
            required
            disabled={register.isPending}
          />
        </FormField>

        <FormField label="Your full name" htmlFor="name">
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            required
            disabled={register.isPending}
          />
        </FormField>

        <FormField label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={register.isPending}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          hint="Minimum 8 characters."
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              required
              disabled={register.isPending}
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

        <Button type="submit" loading={register.isPending} className="w-full mt-1">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-[hsl(var(--foreground))] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
