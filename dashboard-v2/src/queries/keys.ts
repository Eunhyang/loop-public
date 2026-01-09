export const queryKeys = {
  dashboardInit: ['dashboard', 'init'] as const,
  tasks: (filters?: object) => ['tasks', filters] as const,
  task: (id: string) => ['tasks', id] as const,
  attachments: (taskId: string) => ['tasks', taskId, 'attachments'] as const,
  projects: () => ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  programs: () => ['programs'] as const,
  program: (id: string) => ['programs', id] as const,
  pending: () => ['pending'] as const,
  // Activity panel keys
  activityComments: (entityType: string, entityId: string) => ['activity', 'comments', entityType, entityId] as const,
  activityHistory: (entityId: string) => ['activity', 'history', entityId] as const,
};
