import { useDeepLink } from '@/hooks/useDeepLink';

/**
 * Task Page
 * Deep link entry point for /tasks/:id
 * Opens task drawer and redirects to /kanban
 */
export const TaskPage = () => {
  useDeepLink({ entityType: 'task' });
  return null;
};
