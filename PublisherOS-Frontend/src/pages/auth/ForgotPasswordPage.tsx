import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, ApiRequestError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';
import { Alert } from '../../components/ui/Alert';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
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

  if (submitted) {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
            Check your email
          </h1>
        </div>
        <Alert variant="success">
          If an account exists for <strong>{email}</strong>, you'll receive a
          password reset link within a few minutes.
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
          Reset password
        </h1>
        <p className="mt-1 text-[14px] text-[hsl(var(--muted-foreground))]">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {error && (
        <div className="mb-5">
          <Alert variant="error">{error}</Alert>
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
            disabled={loading}
          />
        </FormField>

        <Button type="submit" loading={loading} className="w-full mt-1">
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
        <Link to="/login" className="font-medium text-[hsl(var(--foreground))] hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
