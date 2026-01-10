import { useMemo, useEffect } from 'react';
import { FavoriteCard } from './FavoriteCard';
import { useFavorites } from '../hooks/useFavorites';
import type { Task } from '@/types';

interface FavoritesStripProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export function FavoritesStrip({ tasks, onTaskClick }: FavoritesStripProps) {
  const { favoriteIds, pruneFavorites } = useFavorites();
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.entity_id, task])), [tasks]);
  
  useEffect(() => {
    const validTaskIds = new Set(tasks.map((t) => t.entity_id));
    pruneFavorites(validTaskIds);
  }, [tasks, pruneFavorites]);

  const favoriteTasks = useMemo(() => {
    return favoriteIds.map((id) => taskMap.get(id)).filter((task): task is Task => task !== undefined);
  }, [favoriteIds, taskMap]);

  if (favoriteTasks.length === 0) return null;

  return (
    <div className="glass-moderate border-b border-white/5 px-4 py-2 mb-2">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">Favorites</span>
        {favoriteTasks.map((task) => <FavoriteCard key={task.entity_id} task={task} onTaskClick={onTaskClick} />)}
      </div>
    </div>
  );
}
