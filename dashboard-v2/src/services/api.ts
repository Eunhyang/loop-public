import { httpClient } from './http';
import type { DashboardInitResponse, Project } from '@/types';

export const dashboardApi = {
  // Initial dashboard data (single call for performance)
  getDashboardInit: () =>
    httpClient.get<DashboardInitResponse>('/api/dashboard-init'),

  // Projects (Legacy, to be moved to features/projects)
  getProjects: () =>
    httpClient.get<Project[]>('/api/projects'),

  getProject: (id: string) =>
    httpClient.get<Project>(`/api/projects/${id}`),

  // Pending reviews (Legacy, to be moved to features/pending)
  getPendingReviews: () =>
    httpClient.get('/api/pending'),
};
