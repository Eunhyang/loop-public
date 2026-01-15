import { useDeepLink } from '@/hooks/useDeepLink';

/**
 * Project Page
 * Deep link entry point for /projects/:id
 * Opens project drawer and redirects to /kanban
 */
export const ProjectPage = () => {
  useDeepLink({ entityType: 'project' });
  return null;
};
