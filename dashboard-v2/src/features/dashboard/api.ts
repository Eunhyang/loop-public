import { httpClient } from '@/services/http';
import type { DashboardInitResponse } from '@/types';

export const dashboardApi = {
    // Initial dashboard data (single call for performance)
    getDashboardInit: () =>
        httpClient.get<DashboardInitResponse>('/api/dashboard-init'),
};
