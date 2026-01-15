import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUi } from '@/contexts/UiContext';
import type { EntityType } from '@/contexts/UiContext';

interface UseDeepLinkOptions {
  entityType: EntityType;
  redirectTo?: string;
}

/**
 * Deep Link Hook
 * Parses URL params, opens entity drawer, and redirects to base view
 *
 * Features:
 * - Idempotent (only processes once per mount)
 * - Uses navigate with replace to avoid history pollution
 * - Handles missing/invalid IDs gracefully
 *
 * @param options.entityType - Type of entity ('task' or 'project')
 * @param options.redirectTo - Where to redirect after opening drawer (default: '/kanban')
 */
export function useDeepLink({ entityType, redirectTo = '/kanban' }: UseDeepLinkOptions) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openEntityDrawer } = useUi();

  // Idempotency guard: only process once per mount
  const processedRef = useRef(false);

  useEffect(() => {
    // Skip if already processed or no ID
    if (processedRef.current || !id) {
      return;
    }

    // Mark as processed
    processedRef.current = true;

    // Open entity drawer
    openEntityDrawer({ type: entityType, mode: 'edit', id });

    // Redirect to base view (replace to avoid history pollution)
    navigate(redirectTo, { replace: true });
  }, [id, entityType, redirectTo, navigate, openEntityDrawer]);
}
