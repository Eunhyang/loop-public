import { httpClient } from './http';
import type { DashboardInitResponse, Task, Project } from '@/types';

export const dashboardApi = {
  // Initial dashboard data (single call for performance)
  getDashboardInit: () =>
    httpClient.get<DashboardInitResponse>('/api/dashboard-init'),

  // Tasks
  getTasks: (params?: { status?: string; assignee?: string }) =>
    httpClient.get<Task[]>('/api/tasks', { params }),

  getTask: (id: string) =>
    httpClient.get<Task>(`/api/tasks/${id}`),

  updateTask: (id: string, data: Partial<Task>) =>
    httpClient.put<Task>(`/api/tasks/${id}`, data),

  // Projects
  getProjects: () =>
    httpClient.get<Project[]>('/api/projects'),

  getProject: (id: string) =>
    httpClient.get<Project>(`/api/projects/${id}`),

  // Pending reviews
  getPendingReviews: () =>
    httpClient.get('/api/pending'),

  // Individual Task Operations
  // getTask and updateTask are already defined above or effectively replaced here
  // Ideally, I should merge them, but deleting the duplicates at the bottom is safer if the top ones are correct.
  // Wait, let's look at the file content again in step 194.
  // Line 13: getTask
  // Line 16: updateTask
  // Line 31: updateTask (duplicate!)
  // Line 31 is the one to remove.
};
