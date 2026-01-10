import { useMemo, useEffect } from 'react';
import { FavoriteCard } from './FavoriteCard';
import { useFavorites } from '../hooks/useFavorites';
import type { EntityType } from '../types';

interface BaseEntity {
  entity_id: string;
  entity_name: string;
}

interface FavoritesStripProps {
  tasks?: BaseEntity[];
  projects?: BaseEntity[];
  programs?: BaseEntity[];
  onEntityClick: (entityId: string, entityType: EntityType) => void;
}

export function FavoritesStrip({
  tasks = [],
  projects = [],
  programs = [],
  onEntityClick
}: FavoritesStripProps) {
  const { getFavoriteIds, pruneFavorites } = useFavorites();

  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.entity_id, task])), [tasks]);
  const projectMap = useMemo(() => new Map(projects.map((proj) => [proj.entity_id, proj])), [projects]);
  const programMap = useMemo(() => new Map(programs.map((prog) => [prog.entity_id, prog])), [programs]);

  // Prune invalid favorites for each type
  useEffect(() => {
    pruneFavorites(new Set(tasks.map((t) => t.entity_id)), 'task');
  }, [tasks, pruneFavorites]);

  useEffect(() => {
    pruneFavorites(new Set(projects.map((p) => p.entity_id)), 'project');
  }, [projects, pruneFavorites]);

  useEffect(() => {
    pruneFavorites(new Set(programs.map((p) => p.entity_id)), 'program');
  }, [programs, pruneFavorites]);

  const favoritePrograms = useMemo(() => {
    const ids = getFavoriteIds('program');
    return ids.map((id) => programMap.get(id)).filter((entity): entity is BaseEntity => entity !== undefined);
  }, [getFavoriteIds, programMap]);

  const favoriteProjects = useMemo(() => {
    const ids = getFavoriteIds('project');
    return ids.map((id) => projectMap.get(id)).filter((entity): entity is BaseEntity => entity !== undefined);
  }, [getFavoriteIds, projectMap]);

  const favoriteTasks = useMemo(() => {
    const ids = getFavoriteIds('task');
    return ids.map((id) => taskMap.get(id)).filter((entity): entity is BaseEntity => entity !== undefined);
  }, [getFavoriteIds, taskMap]);

  // Render order: Program → Project → Task
  const allFavorites = useMemo(() => [
    ...favoritePrograms.map(entity => ({ entity, type: 'program' as EntityType })),
    ...favoriteProjects.map(entity => ({ entity, type: 'project' as EntityType })),
    ...favoriteTasks.map(entity => ({ entity, type: 'task' as EntityType }))
  ], [favoritePrograms, favoriteProjects, favoriteTasks]);

  if (allFavorites.length === 0) return null;

  return (
    <div className="glass-moderate border-b border-white/5 px-4 py-2 mb-2">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">Favorites</span>
        {allFavorites.map(({ entity, type }) => (
          <FavoriteCard key={`${type}-${entity.entity_id}`} entity={entity} entityType={type} onEntityClick={onEntityClick} />
        ))}
      </div>
    </div>
  );
}
