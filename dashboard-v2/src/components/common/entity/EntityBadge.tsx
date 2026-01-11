import { useRelationClick } from '../hooks/useRelationClick';

type EntityType = 'task' | 'project' | 'program' | 'track' | 'condition' | 'hypothesis';

interface EntityBadgeProps {
  type: EntityType;
  id: string;
  label?: string;
  mode?: 'view' | 'edit';
  className?: string;
}

const entityIcons: Record<EntityType, string> = {
  task: '📋',
  project: '📁',
  program: '📦',
  track: '📊',
  condition: '⚠️',
  hypothesis: '💡',
};

const entityColors: Record<EntityType, string> = {
  task: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
  project: 'bg-green-100 hover:bg-green-200 text-green-800',
  program: 'bg-purple-100 hover:bg-purple-200 text-purple-800',
  track: 'bg-orange-100 hover:bg-orange-200 text-orange-800',
  condition: 'bg-red-100 hover:bg-red-200 text-red-800',
  hypothesis: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800',
};

/**
 * Clickable entity badge that opens the entity drawer
 * Used for displaying and navigating entity relationships
 */
export function EntityBadge({ type, id, label, mode = 'view', className = '' }: EntityBadgeProps) {
  const { openRelation } = useRelationClick();

  const displayLabel = label || id;
  const icon = entityIcons[type];
  const colorClass = entityColors[type];

  const handleClick = () => {
    openRelation(type, id, mode);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium
        transition-colors cursor-pointer
        ${colorClass}
        ${className}
      `}
      title={`Open ${type}: ${id}`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span>{displayLabel}</span>
    </button>
  );
}
