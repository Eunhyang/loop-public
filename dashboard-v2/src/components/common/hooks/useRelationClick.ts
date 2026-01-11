import { useCallback } from 'react';
import { useUi } from '@/contexts/UiContext';

type EntityType = 'task' | 'project' | 'program' | 'track' | 'condition' | 'hypothesis';

/**
 * Hook for handling entity relationship clicks
 * Returns a callback to open entity drawer for a given entity type and ID
 */
export function useRelationClick() {
  const { openEntityDrawer } = useUi();

  const openRelation = useCallback((type: EntityType, id: string, mode: 'view' | 'edit' = 'view') => {
    if (!id) {
      console.warn(`[useRelationClick] Cannot open ${type} with empty ID`);
      return;
    }

    openEntityDrawer({ type, mode, id });
  }, [openEntityDrawer]);

  return { openRelation };
}
