import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publisherApi, ApiRequestError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';

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
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publisher) {
      setName(publisher.name);
      setWebsite(publisher.website ?? '');
      setDescription(publisher.description ?? '');
    }
  }, [publisher]);

  const update = useMutation({
    mutationFn: (data: { name?: string; website?: string | null; description?: string | null }) =>
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

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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

        <div className="pt-1">
          <Button type="submit" loading={update.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
