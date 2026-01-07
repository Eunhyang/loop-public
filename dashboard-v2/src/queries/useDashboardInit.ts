import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';
import { queryKeys } from './keys';

export const useDashboardInit = () => {
  return useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: async () => {
      const { data } = await dashboardApi.getDashboardInit();
      return data;
    },
    staleTime: Infinity, // Initial data persists until page refresh
  });
};
