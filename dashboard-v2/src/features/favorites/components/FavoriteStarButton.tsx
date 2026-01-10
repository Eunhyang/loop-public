import { useFavorites } from '../hooks/useFavorites';
import type { EntityType } from '../types';

interface FavoriteStarButtonProps {
  entityId: string;
  entityType: EntityType;
  size?: 'sm' | 'md';
  className?: string;
}

export function FavoriteStarButton({ entityId, entityType, size = 'sm', className = '' }: FavoriteStarButtonProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(entityId, entityType);
  const sizeClasses = { sm: 'w-3 h-3', md: 'w-4 h-4' };

  // Color mapping with fallback (static classes for Tailwind JIT)
  const colorMap: Record<EntityType, { filled: string; unfilled: string; hover: string }> = {
    task: { filled: 'text-amber-400', unfilled: 'text-zinc-300', hover: 'hover:text-amber-400' },
    project: { filled: 'text-blue-400', unfilled: 'text-zinc-300', hover: 'hover:text-blue-400' },
    program: { filled: 'text-purple-400', unfilled: 'text-zinc-300', hover: 'hover:text-purple-400' }
  };
  const colors = colorMap[entityType] || colorMap.task; // Fallback to task colors

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(entityId, entityType);
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses[size]} ${favorited ? colors.filled : colors.unfilled} ${colors.hover} transition-colors ${className}`}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {favorited ? (
        <svg className={sizeClasses[size]} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : (
        <svg className={sizeClasses[size]} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
    </button>
  );
}
