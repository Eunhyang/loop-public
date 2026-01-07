export const queryKeys = {
  dashboardInit: ['dashboard', 'init'] as const,
  tasks: (filters?: object) => ['tasks', filters] as const,
  task: (id: string) => ['tasks', id] as const,
  projects: () => ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  pending: () => ['pending'] as const,
};
