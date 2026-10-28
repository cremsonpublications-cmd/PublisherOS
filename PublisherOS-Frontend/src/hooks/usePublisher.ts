import { useQuery } from '@tanstack/react-query';
import { publisherApi } from '../lib/api';

export function usePublisher() {
  return useQuery({
    queryKey: ['publisher'],
    queryFn: async () => {
      const data = await publisherApi.getMe();
      return data.publisher;
    },
  });
}
