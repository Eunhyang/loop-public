import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/queries/keys';
import { activityApi } from '../api';

interface UseEntityHistoryParams {
  entityId: string;
  enabled?: boolean;
}

export function useEntityHistory({ entityId, enabled = true }: UseEntityHistoryParams) {
  return useQuery({
    queryKey: queryKeys.activityHistory(entityId),
    queryFn: () => activityApi.getEntityHistory(entityId),
    enabled: enabled && !!entityId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
