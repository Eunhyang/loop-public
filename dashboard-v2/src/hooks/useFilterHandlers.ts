import { useCallback } from 'react';
import { useCombinedFilters } from './useCombinedFilters';
import { useUi } from '@/contexts/UiContext';

/**
 * useFilterHandlers - 필터링 + Drawer 열기 공통 로직
 *
 * TaskFilterBar, FavoritesStrip에서 공유하는 필터 핸들러.
 * Program/Project 필터 토글 및 Entity Drawer 열기 기능 제공.
 */
export function useFilterHandlers() {
  const { programId, projectIds, setProgramId, toggleProjectId } = useCombinedFilters();
  const { openEntityDrawer } = useUi();

  // Program 필터 토글
  const handleProgramFilter = useCallback((progId: string) => {
    if (programId === progId) {
      setProgramId(null);
    } else {
      setProgramId(progId);
    }
  }, [programId, setProgramId]);

  // Project 필터 토글
  const handleProjectFilter = useCallback((projId: string) => {
    toggleProjectId(projId);
  }, [toggleProjectId]);

  // Drawer 열기
  const openDrawer = useCallback((type: 'task' | 'project' | 'program', id: string) => {
    openEntityDrawer({ type, mode: 'edit', id });
  }, [openEntityDrawer]);

  return {
    handleProgramFilter,
    handleProjectFilter,
    openDrawer,
    // 현재 활성 상태 (UI 표시용)
    activeProgramId: programId,
    activeProjectIds: projectIds,
  };
}
