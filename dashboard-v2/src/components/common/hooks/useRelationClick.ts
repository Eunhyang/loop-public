import { useCallback } from 'react';
import { useUi } from '@/contexts/UiContext';

type EntityType = 'task' | 'project' | 'program' | 'track' | 'condition' | 'hypothesis';

/**
 * Hook for handling entity relationship clicks
 * Returns a callback to open entity drawer for a given entity type and ID
 * Uses pushDrawer to preserve navigation history (browser-style back/forward)
 */
export function useRelationClick() {
  const { pushDrawer } = useUi();

  const openRelation = useCallback((type: EntityType, id: string, mode: 'view' | 'edit' = 'view') => {
    if (!id) {
      console.warn(`[useRelationClick] Cannot open ${type} with empty ID`);
      return;
    }

    pushDrawer({ type, mode, id });
  }, [pushDrawer]);

  return { openRelation };
}
