import { useFavorites } from '../hooks/useFavorites';

interface FavoriteStarButtonProps {
  taskId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function FavoriteStarButton({ taskId, size = 'sm', className = '' }: FavoriteStarButtonProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(taskId);
  const sizeClasses = { sm: 'w-3 h-3', md: 'w-4 h-4' };
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleFavorite(taskId);
    if (!added && !favorited) {
      console.warn('Cannot add more favorites (limit reached)');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={\`\${sizeClasses[size]} \${favorited ? 'text-amber-400' : 'text-zinc-300 hover:text-amber-400'} transition-colors \${className}\`}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
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
