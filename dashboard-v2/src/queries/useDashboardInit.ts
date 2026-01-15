import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/features/dashboard/api';
import { queryKeys } from './keys';
import { authStorage } from '@/features/auth/storage';

export const useDashboardInit = () => {
  const isAuthenticated = authStorage.isAuthenticated();

  return useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: async () => {
      const { data } = await dashboardApi.getDashboardInit();
      return data;
    },
    staleTime: Infinity, // Initial data persists until page refresh
    enabled: isAuthenticated, // Only fetch when authenticated (prevents 401 loop on login page)
  });
};
