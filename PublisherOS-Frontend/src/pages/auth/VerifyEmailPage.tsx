import React, { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi, ApiRequestError } from '../../lib/api';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../providers/AuthProvider';

export function VerifyEmailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string } | null)?.email ?? '';
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) {
      setError('Enter all 6 digits.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resolvedEmail = emailFromState || user?.email || '';
      await authApi.verifyEmail({ otp, email: resolvedEmail });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Verification failed. Try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setResendMsg(null);
    try {
      await authApi.resendVerification();
      setResendMsg('A new code has been sent to your email.');
    } catch {
      setResendMsg('Could not resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
            Email verified
          </h1>
          <p className="mt-1 text-[14px] text-[hsl(var(--muted-foreground))]">
            Your account is now active.
          </p>
        </div>
        <button
          disabled
          className="w-full h-10 rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[14px] font-medium text-[hsl(var(--muted-foreground))] flex items-center justify-center gap-2 cursor-default"
        >
          <svg className="w-4 h-4 text-[hsl(var(--foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Email verified — redirecting…
        </button>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
          Verify your email
        </h1>
        <p className="mt-1 text-[14px] text-[hsl(var(--muted-foreground))]">
          Enter the 6-digit code sent to{' '}
          <span className="font-medium text-[hsl(var(--foreground))]">
            {emailFromState || user?.email || 'your email'}
          </span>
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {resendMsg && <Alert variant="success">{resendMsg}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="flex justify-between gap-2 mb-6">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-[22px] font-semibold rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          ))}
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          {loading ? 'Verifying email…' : 'Verify'}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
        Didn't receive a code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading}
          className="font-medium text-[hsl(var(--foreground))] hover:underline disabled:opacity-50"
        >
          {resendLoading ? 'Sending…' : 'Resend'}
        </button>
      </p>

      <p className="mt-3 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
        <Link to="/login" className="font-medium text-[hsl(var(--foreground))] hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
