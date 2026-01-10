import { useFavorites } from '../hooks/useFavorites';
import type { EntityType } from '../types';

// Union type for all entity types (Task, Project, Program must have entity_id and entity_name)
interface BaseEntity {
  entity_id: string;
  entity_name: string;
}

interface FavoriteCardProps {
  entity: BaseEntity;
  entityType: EntityType;
  isFilterActive?: boolean;   // Project/Program 필터 활성 상태
  onCardClick: () => void;    // Task: Drawer, Project/Program: 필터링
  onDrawerClick?: () => void; // Project/Program만: "i" 클릭 → Drawer
}

export function FavoriteCard({
  entity,
  entityType,
  isFilterActive = false,
  onCardClick,
  onDrawerClick
}: FavoriteCardProps) {
  const { toggleFavorite } = useFavorites();

  // Color mapping with fallback
  const colorMap: Record<EntityType, { star: string; border: string; activeBg: string }> = {
    task: { star: 'text-amber-400 fill-amber-400', border: 'border-amber-100', activeBg: 'bg-amber-50' },
    project: { star: 'text-blue-400 fill-blue-400', border: 'border-blue-100', activeBg: 'bg-blue-50' },
    program: { star: 'text-purple-400 fill-purple-400', border: 'border-purple-100', activeBg: 'bg-purple-50' }
  };
  const colors = colorMap[entityType] || colorMap.task; // Fallback to task colors

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(entity.entity_id, entityType);
  };

  const handleDrawerClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onDrawerClick?.();
  };

  // Project/Program일 때 pr-7로 "i" 아이콘 공간 확보
  const hasDrawerIcon = entityType !== 'task' && onDrawerClick;

  return (
    <button
      onClick={onCardClick}
      className={`relative flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white border ${colors.border} rounded-md hover:bg-zinc-50 transition-all group max-w-[200px] shrink-0 ${
        isFilterActive ? `ring-2 ring-offset-1 ${colors.activeBg}` : ''
      } ${hasDrawerIcon ? 'pr-7' : ''}`}
      title={entity.entity_name}
    >
      <svg className={`w-3 h-3 ${colors.star} shrink-0`} viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="truncate text-zinc-700">{entity.entity_name}</span>

      {/* Project/Program: "i" 아이콘으로 Drawer 열기 */}
      {hasDrawerIcon && (
        <span
          role="button"
          tabIndex={0}
          className="drawer-icon"
          onClick={handleDrawerClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDrawerClick(e);
            }
          }}
          aria-label={`Edit ${entity.entity_name}`}
          title="Edit"
        >
          i
        </span>
      )}

      {/* X 버튼으로 즐겨찾기 제거 */}
      <svg
        onClick={handleRemove}
        className="w-3 h-3 text-zinc-400 shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
