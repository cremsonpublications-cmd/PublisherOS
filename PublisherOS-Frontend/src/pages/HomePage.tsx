import { useQuery } from '@tanstack/react-query';
import { config } from '../config';

interface HealthResponse {
  status: string;
  timestamp: string;
}

function useApiHealth() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch(`${config.apiBaseUrl}/api/v1/health`);
      if (!res.ok) throw new Error('Health check failed');
      return res.json() as Promise<HealthResponse>;
    },
    refetchInterval: 30_000,
    retry: false,
  });
}

export function HomePage() {
  const health = useApiHealth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="max-w-2xl">
        {/* Wordmark */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <span className="text-2xl font-semibold text-gray-900 tracking-tight">
            Publisher<span className="text-blue-600">OS</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
          Publishing infrastructure
          <br />
          for modern media companies.
        </h1>
        <p className="text-lg text-gray-500 mb-12">
          Multi-tenant platform for managing publishers, content, and
          distribution at scale. Phase 1 foundation is running.
        </p>

        {/* API Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 inline-block">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            API Status
          </p>
          <div className="flex items-center gap-3">
            {health.isLoading && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-sm text-gray-600">Connecting…</span>
              </>
            )}
            {health.isSuccess && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-sm text-gray-700 font-medium">
                  Connected
                </span>
                <span className="text-xs text-gray-400">
                  {config.apiBaseUrl}
                </span>
              </>
            )}
            {health.isError && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-sm text-gray-700 font-medium">
                  Unreachable
                </span>
                <span className="text-xs text-gray-400">
                  Is the API running? ({config.apiBaseUrl})
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
