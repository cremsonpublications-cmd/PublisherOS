import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { publicApi, ApiRequestError } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FormField } from '../components/ui/FormField';
import { Alert } from '../components/ui/Alert';

type View = 'home' | 'login' | 'register' | 'verify' | 'account';

// ── Eye icon toggle ───────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
      <line x1="2" y1="2" x2="14" y2="14" />
    </svg>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="pr-9"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PublicStorefrontPage() {
  const [view, setView] = useState<View>('home');
  const [pendingEmail, setPendingEmail] = useState('');
  const [customer, setCustomer] = useState<{ name: string; email: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-publisher'],
    queryFn: () => publicApi.getPublisherByDomain(),
    retry: false,
    staleTime: Infinity,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner size={24} /></div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[15px] text-[hsl(var(--muted-foreground))]">Publisher not found for this domain.</p>
      </div>
    );
  }

  const { publisher } = data;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] px-6 py-4 flex items-center justify-between">
        <button onClick={() => setView('home')} className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-[6px] bg-[hsl(var(--primary))] flex items-center justify-center text-white text-[13px] font-bold">
            {publisher.name.charAt(0).toUpperCase()}
          </span>
          <span className="text-[16px] font-semibold text-[hsl(var(--foreground))]">{publisher.name}</span>
        </button>
        <div className="flex items-center gap-2">
          {customer ? (
            <button onClick={() => setView('account')} className="text-[13px] font-medium hover:underline">
              {customer.name}
            </button>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => setView('login')}>Sign in</Button>
              <Button size="sm" onClick={() => setView('register')}>Sign up</Button>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {view === 'home' && (
          <div className="text-center max-w-lg">
            <h1 className="text-[36px] font-bold tracking-tight mb-4">Welcome to {publisher.name}</h1>
            {publisher.description && (
              <p className="text-[16px] text-[hsl(var(--muted-foreground))] mb-8 leading-relaxed">{publisher.description}</p>
            )}
            {!customer && (
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setView('register')}>Create account</Button>
                <Button variant="secondary" onClick={() => setView('login')}>Sign in</Button>
              </div>
            )}
            {publisher.website && (
              <a href={publisher.website} target="_blank" rel="noopener noreferrer"
                className="inline-block mt-6 text-[13px] text-[hsl(var(--primary))] hover:underline">
                Visit website →
              </a>
            )}
          </div>
        )}

        {view === 'register' && (
          <RegisterForm
            publisherName={publisher.name}
            onNeedsVerification={(email) => { setPendingEmail(email); setView('verify'); }}
            onSwitchToLogin={() => setView('login')}
          />
        )}

        {view === 'verify' && (
          <VerifyForm
            email={pendingEmail}
            onSuccess={(u) => { setCustomer(u); setView('account'); }}
          />
        )}

        {view === 'login' && (
          <LoginForm
            publisherName={publisher.name}
            onSuccess={(u) => { setCustomer(u); setView('account'); }}
            onSwitchToRegister={() => setView('register')}
          />
        )}

        {view === 'account' && customer && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[22px] font-bold text-[hsl(var(--muted-foreground))] mx-auto mb-4">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-[22px] font-semibold mb-1">{customer.name}</h2>
            <p className="text-[13px] text-[hsl(var(--muted-foreground))] mb-6">{customer.email}</p>
            <Button variant="secondary" onClick={() => { setCustomer(null); setView('home'); }}>Sign out</Button>
          </div>
        )}
      </main>

      <footer className="text-center py-4 border-t border-[hsl(var(--border))]">
        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
          Powered by <span className="font-medium text-[hsl(var(--foreground))]">PublisherOS</span>
        </p>
      </footer>
    </div>
  );
}

// ── Register form ─────────────────────────────────────────────────────────────

function RegisterForm({
  publisherName,
  onNeedsVerification,
  onSwitchToLogin,
}: {
  publisherName: string;
  onNeedsVerification: (email: string) => void;
  onSwitchToLogin: () => void;
}) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => publicApi.register(form),
    onSuccess: () => onNeedsVerification(form.email),
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : 'Registration failed'),
  });

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-[22px] font-semibold mb-1">Create account</h2>
      <p className="text-[13px] text-[hsl(var(--muted-foreground))] mb-6">Join {publisherName}</p>
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(); }} className="space-y-4">
        <FormField label="Name" htmlFor="reg-name">
          <Input id="reg-name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} disabled={mutation.isPending} />
        </FormField>
        <FormField label="Email" htmlFor="reg-email">
          <Input id="reg-email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} disabled={mutation.isPending} />
        </FormField>
        <FormField label="Password" htmlFor="reg-password">
          <PasswordInput id="reg-password" value={form.password} onChange={(v) => setForm(f => ({ ...f, password: v }))} disabled={mutation.isPending} />
        </FormField>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-[hsl(var(--primary))] hover:underline">Sign in</button>
      </p>
    </div>
  );
}

// ── Verify form ───────────────────────────────────────────────────────────────

function VerifyForm({
  email,
  onSuccess,
}: {
  email: string;
  onSuccess: (user: { name: string; email: string }) => void;
}) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const isDev = import.meta.env.DEV;

  const mutation = useMutation({
    mutationFn: () => publicApi.verifyEmail({ email, otp }),
    onSuccess: (data) => onSuccess({ name: data.user.name, email: data.user.email }),
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : 'Verification failed'),
  });

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-[22px] font-semibold mb-1">Verify your email</h2>
      <p className="text-[13px] text-[hsl(var(--muted-foreground))] mb-1">
        We sent a 6-digit code to <strong>{email}</strong>
      </p>
      {isDev && (
        <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-[6px] px-3 py-2 mb-4">
          Dev mode — use OTP: <strong className="font-mono">123456</strong>
        </p>
      )}
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(); }} className="space-y-4">
        <FormField label="Verification code" htmlFor="otp">
          <Input
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            maxLength={6}
            className="font-mono tracking-widest text-center text-[20px]"
            disabled={mutation.isPending}
          />
        </FormField>
        <Button type="submit" disabled={otp.length !== 6 || mutation.isPending} className="w-full">
          {mutation.isPending ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>
    </div>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({
  publisherName,
  onSuccess,
  onSwitchToRegister,
}: {
  publisherName: string;
  onSuccess: (user: { name: string; email: string }) => void;
  onSwitchToRegister: () => void;
}) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => publicApi.login(form),
    onSuccess: (data) => onSuccess({ name: data.user.name, email: data.user.email }),
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : 'Login failed'),
  });

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-[22px] font-semibold mb-1">Sign in</h2>
      <p className="text-[13px] text-[hsl(var(--muted-foreground))] mb-6">Welcome back to {publisherName}</p>
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(); }} className="space-y-4">
        <FormField label="Email" htmlFor="login-email">
          <Input id="login-email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} disabled={mutation.isPending} />
        </FormField>
        <FormField label="Password" htmlFor="login-password">
          <PasswordInput id="login-password" value={form.password} onChange={(v) => setForm(f => ({ ...f, password: v }))} disabled={mutation.isPending} />
        </FormField>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-center text-[13px] text-[hsl(var(--muted-foreground))]">
        Don't have an account?{' '}
        <button onClick={onSwitchToRegister} className="text-[hsl(var(--primary))] hover:underline">Sign up</button>
      </p>
    </div>
  );
}
