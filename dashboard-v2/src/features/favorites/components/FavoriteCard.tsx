import { useFavorites } from '../hooks/useFavorites';
import type { Task } from '@/types';

interface FavoriteCardProps {
  task: Task;
  onTaskClick: (taskId: string) => void;
}

export function FavoriteCard({ task, onTaskClick }: FavoriteCardProps) {
  const { toggleFavorite } = useFavorites();
  const handleClick = () => onTaskClick(task.entity_id);
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(task.entity_id);
  };

  return (
    <button onClick={handleClick} className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-all group max-w-[180px] shrink-0" title={task.entity_name}>
      <svg className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="truncate text-zinc-700">{task.entity_name}</span>
      <svg onClick={handleRemove} className="w-3 h-3 text-zinc-400 shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
