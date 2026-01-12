import { useRelationClick } from '../hooks/useRelationClick';
import { EntityChip } from './EntityChip';
import { statusColors, priorityColors, taskTypeColors, memberColor, projectColor, trackColor, programColor, getColor, defaultColor } from '../chipColors';

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

const entityColorMaps: Record<EntityType, any> = {
  task: taskTypeColors,
  project: projectColor,
  program: programColor,
  track: trackColor,
  condition: statusColors, // Fallback to status colors for conditions
  hypothesis: statusColors, // Fallback
};

/**
 * Clickable entity badge that opens the entity drawer
 * Refactored to use EntityChip for consistent styling.
 */
export function EntityBadge({ type, id, label, mode = 'view', className = '' }: EntityBadgeProps) {
  const { openRelation } = useRelationClick();

  const displayLabel = label || id;
  const icon = entityIcons[type];

  // Determine color
  let color = defaultColor;
  if (type === 'project') color = projectColor;
  else if (type === 'track') color = trackColor;
  else if (type === 'program') color = programColor;
  else if (type === 'task') color = taskTypeColors.dev; // Default task color
  // Condition and Hypothesis use specific colors in chipColors.ts (if they existed, but they don't have dedicated ones yet)
  // We'll use default or mapped ones.

  const handleClick = () => {
    openRelation(type, id, mode);
  };

  return (
    <EntityChip
      label={displayLabel}
      icon={icon}
      mode="link"
      color={color}
      onNavigate={handleClick}
      className={className}
    />
  );
}
