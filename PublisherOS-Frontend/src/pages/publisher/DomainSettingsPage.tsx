import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePublisher } from '../../hooks/usePublisher';
import { publisherApi, ApiRequestError } from '../../lib/api';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';

export function DomainSettingsPage() {
  const queryClient = useQueryClient();
  const { data: publisher, isLoading } = usePublisher();

  const [domain, setDomain] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const setMutation = useMutation({
    mutationFn: () => publisherApi.setCustomDomain(domain.trim()),
    onSuccess: (data) => {
      queryClient.setQueryData(['publisher'], data.publisher);
      setSuccessMsg('Custom domain saved. Point your domain\'s CNAME or A record to this server to activate it.');
      setErrorMsg('');
      setDomain('');
    },
    onError: (err) => {
      setSuccessMsg('');
      setErrorMsg(err instanceof ApiRequestError ? err.message : 'Failed to save domain');
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => publisherApi.removeCustomDomain(),
    onSuccess: (data) => {
      queryClient.setQueryData(['publisher'], data.publisher);
      setSuccessMsg('Custom domain removed.');
      setErrorMsg('');
    },
    onError: (err) => {
      setErrorMsg(err instanceof ApiRequestError ? err.message : 'Failed to remove domain');
    },
  });

  if (isLoading) return null;

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-[22px] font-semibold text-[hsl(var(--foreground))] tracking-tight mb-1">
        Custom Domain
      </h1>
      <p className="text-[13px] text-[hsl(var(--muted-foreground))] mb-6">
        Connect your own domain so visitors reach your publisher website at your address.
      </p>

      {successMsg && (
        <div className="mb-4">
          <Alert variant="success">{successMsg}</Alert>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4">
          <Alert variant="error">{errorMsg}</Alert>
        </div>
      )}

      {/* Current domain */}
      {publisher?.customDomain ? (
        <div className="mb-6 rounded-[8px] border border-[hsl(var(--border))] p-4">
          <p className="text-[12px] text-[hsl(var(--muted-foreground))] font-medium mb-1">
            Connected domain
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[14px] font-mono font-medium text-[hsl(var(--foreground))]">
              {publisher.customDomain}
            </span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                publisher.customDomainVerifiedAt
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {publisher.customDomainVerifiedAt ? 'Verified' : 'Pending DNS'}
            </span>
          </div>

          {!publisher.customDomainVerifiedAt && (
            <div className="mt-3 bg-[hsl(var(--muted))] rounded-[6px] p-3 text-[12px] text-[hsl(var(--muted-foreground))]">
              <p className="font-medium mb-1">DNS setup instructions</p>
              <p>Add a CNAME record pointing <strong>{publisher.customDomain}</strong> to your PublisherOS server hostname, or an A record pointing to the server IP.</p>
              <p className="mt-1.5 font-mono text-[11px]">
                {publisher.customDomain} → CNAME → your-server.example.com
              </p>
              <p className="mt-2 text-[11px]">
                <strong>Local dev:</strong> Add{' '}
                <code className="bg-white px-1 rounded border border-[hsl(var(--border))]">
                  127.0.0.1  {publisher.customDomain}
                </code>{' '}
                to <code>/etc/hosts</code>.
              </p>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            disabled={removeMutation.isPending}
            onClick={() => removeMutation.mutate()}
          >
            {removeMutation.isPending ? 'Removing…' : 'Remove domain'}
          </Button>
        </div>
      ) : (
        <p className="mb-4 text-[13px] text-[hsl(var(--muted-foreground))]">
          No custom domain connected.
        </p>
      )}

      {/* Set / update domain form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMutation.mutate();
        }}
        className="space-y-4"
      >
        <FormField label="Domain name" htmlFor="custom-domain">
          <Input
            id="custom-domain"
            type="text"
            placeholder="apublisher.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={setMutation.isPending}
          />
        </FormField>
        <Button
          type="submit"
          disabled={!domain.trim() || setMutation.isPending}
        >
          {setMutation.isPending ? 'Saving…' : publisher?.customDomain ? 'Update domain' : 'Connect domain'}
        </Button>
      </form>
    </div>
  );
}
