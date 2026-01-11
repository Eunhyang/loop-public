import { EntityBadge } from './EntityBadge';

type EntityType = 'task' | 'project' | 'program' | 'track' | 'condition' | 'hypothesis';

interface EntityBadgeGroupProps {
  type: EntityType;
  ids: string[];
  mode?: 'view' | 'edit';
  className?: string;
  emptyText?: string;
}

/**
 * Group of entity badges for displaying arrays of related entities
 * Shows empty state if no IDs provided
 */
export function EntityBadgeGroup({
  type,
  ids,
  mode = 'view',
  className = '',
  emptyText = 'None'
}: EntityBadgeGroupProps) {
  if (!ids || ids.length === 0) {
    return <span className="text-sm text-gray-400 italic">{emptyText}</span>;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {ids.map((id) => (
        <EntityBadge key={id} type={type} id={id} mode={mode} />
      ))}
    </div>
  );
}
