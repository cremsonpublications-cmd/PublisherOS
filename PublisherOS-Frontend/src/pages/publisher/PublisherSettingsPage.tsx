import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publisherApi, ApiRequestError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="pb-6 mb-6 border-b border-[hsl(var(--border))] last:border-0 last:mb-0 last:pb-0">
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">{title}</h2>
        {description && (
          <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Color swatch picker ────────────────────────────────────────────────────────

function ColorField({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        id={`${id}-picker`}
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-9 h-9 rounded-[6px] border border-[hsl(var(--input))] cursor-pointer p-0.5 bg-white disabled:opacity-50"
        aria-label="Pick brand colour"
      />
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#1a73e8"
        disabled={disabled}
        className="font-mono w-32"
        maxLength={7}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          disabled={disabled}
          className="text-[12px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-50"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PublisherSettingsPage() {
  const qc = useQueryClient();
  const { data: publisher, isLoading } = useQuery({
    queryKey: ['publisher'],
    queryFn: async () => {
      const data = await publisherApi.getMe();
      return data.publisher;
    },
  });

  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publisher) {
      setName(publisher.name);
      setWebsite(publisher.website ?? '');
      setDescription(publisher.description ?? '');
      setLogoUrl(publisher.logoUrl ?? '');
      setBrandColor(publisher.brandColor ?? '');
      setContactEmail(publisher.contactEmail ?? '');
      setContactPhone(publisher.contactPhone ?? '');
    }
  }, [publisher]);

  const update = useMutation({
    mutationFn: (data: Parameters<typeof publisherApi.updateMe>[0]) =>
      publisherApi.updateMe(data),
    onSuccess: (data) => {
      qc.setQueryData(['publisher'], data.publisher);
      setSaved(true);
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to save changes.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    update.mutate({
      name,
      website: website || null,
      description: description || null,
      logoUrl: logoUrl || null,
      brandColor: brandColor || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Spinner size={20} />
      </div>
    );
  }

  if (!publisher) return null;

  return (
    <div className="p-6 max-w-[640px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
          Publisher settings
        </h1>
        <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-1">
          Manage details for <strong>{publisher.name}</strong>
        </p>
      </div>

      {/* Read-only info */}
      <div className="mb-6 p-4 bg-[hsl(var(--muted))] rounded-[8px] flex flex-col gap-2">
        <div className="flex justify-between text-[13px]">
          <span className="text-[hsl(var(--muted-foreground))]">Slug</span>
          <span className="font-medium text-[hsl(var(--foreground))] font-mono text-[12px]">/{publisher.slug}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-[hsl(var(--muted-foreground))]">Status</span>
          <span className="font-medium text-[hsl(var(--foreground))] capitalize">{publisher.status.toLowerCase()}</span>
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {saved && (
        <div className="mb-5">
          <Alert variant="success">Changes saved.</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-0">

        {/* ── Basic info ── */}
        <Section title="Basic information" description="Your publisher name and public-facing description.">
          <div className="flex flex-col gap-4">
            <FormField label="Publisher name" htmlFor="pub-name">
              <Input
                id="pub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={update.isPending}
              />
            </FormField>

            <FormField label="Website" htmlFor="pub-website">
              <Input
                id="pub-website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                disabled={update.isPending}
              />
            </FormField>

            <FormField label="Description" htmlFor="pub-description">
              <textarea
                id="pub-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={update.isPending}
                className="w-full px-3 py-2 rounded-[var(--radius)] text-[14px] bg-white border border-[hsl(var(--input))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 resize-none"
              />
            </FormField>
          </div>
        </Section>

        {/* ── Branding ── */}
        <Section title="Branding" description="Logo and accent colour displayed on your public storefront.">
          <div className="flex flex-col gap-4">
            <FormField label="Logo URL" htmlFor="pub-logo">
              <Input
                id="pub-logo"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://cdn.example.com/logo.png"
                disabled={update.isPending}
              />
              {logoUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-10 w-10 rounded-[6px] object-contain border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-1"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Preview</span>
                </div>
              )}
            </FormField>

            <FormField label="Brand colour" htmlFor="pub-brand-color">
              <ColorField
                id="pub-brand-color"
                value={brandColor}
                onChange={setBrandColor}
                disabled={update.isPending}
              />
              <p className="mt-1.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                Used as the accent colour on your storefront.
              </p>
            </FormField>
          </div>
        </Section>

        {/* ── Contact ── */}
        <Section title="Contact information" description="Shown to readers on your public storefront.">
          <div className="flex flex-col gap-4">
            <FormField label="Contact email" htmlFor="pub-contact-email">
              <Input
                id="pub-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="hello@yourpublication.com"
                disabled={update.isPending}
              />
            </FormField>

            <FormField label="Contact phone" htmlFor="pub-contact-phone">
              <Input
                id="pub-contact-phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                disabled={update.isPending}
              />
            </FormField>
          </div>
        </Section>

        <div className="pt-2">
          <Button type="submit" loading={update.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
