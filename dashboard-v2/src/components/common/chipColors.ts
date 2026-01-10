/**
 * Chip color mappings for Notion-style chip selects
 * Tailwind CSS classes for consistent styling
 */

export interface ChipColor {
  bg: string;
  text: string;
  selected: string; // Darker background for selected state
}

/**
 * Status colors (5 states)
 */
export const statusColors: Record<string, ChipColor> = {
  todo: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#f1f5f9] !text-[#475569] !border-[#cbd5e1]',
  },
  doing: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#f1f5f9] !text-[#1e40af] !border-[#bfdbfe]',
  },
  done: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#f0fdf4] !text-[#166534] !border-[#bbf7d0]',
  },
  hold: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#fffbeb] !text-[#92400e] !border-[#fef3c7]',
  },
  blocked: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#fff1f2] !text-[#9f1239] !border-[#fecdd3]',
  },
};

/**
 * Priority colors (4 levels)
 */
export const priorityColors: Record<string, ChipColor> = {
  critical: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#f5f3ff] !text-[#5b21b6] !border-[#ddd6fe]',
  },
  high: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#fff1f2] !text-[#9f1239] !border-[#fecdd3]',
  },
  medium: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#fffbeb] !text-[#92400e] !border-[#fef3c7]',
  },
  low: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-600',
    selected: '!bg-[#f1f5f9] !text-[#475569] !border-[#cbd5e1]',
  },
};

/**
 * Member colors (for assignee/owner chips)
 */
export const memberColor: ChipColor = {
  bg: 'bg-white border-zinc-200',
  text: 'text-zinc-400',
  selected: '!bg-[#f1f5f9] !text-[#334155] !border-[#cbd5e1]',
};

/**
 * Project colors (for project selection chips)
 */
export const projectColor: ChipColor = {
  bg: 'bg-white border-zinc-200',
  text: 'text-zinc-400',
  selected: '!bg-[#f1f5f9] !text-[#334155] !border-[#cbd5e1]',
};

/**
 * Unassigned state color (low emphasis)
 */
export const unassignedColor: ChipColor = {
  bg: 'bg-white',
  text: 'text-zinc-400',
  selected: '!bg-[#f1f5f9] !text-[#64748b] !border-[#e2e8f0]',
};

/**
 * Track colors (for track selection chips)
 */
export const trackColor: ChipColor = {
  bg: 'bg-white border-zinc-200',
  text: 'text-zinc-500',
  selected: '!bg-[#fef3c7] !text-[#92400e] !border-[#fcd34d]',  // amber
};

/**
 * Program colors (for program selection chips)
 */
export const programColor: ChipColor = {
  bg: 'bg-white border-zinc-200',
  text: 'text-zinc-500',
  selected: '!bg-[#f5f3ff] !text-[#5b21b6] !border-[#ddd6fe]',  // purple
};

/**
 * Default fallback color for undefined values
 */
export const defaultColor: ChipColor = {
  bg: 'bg-white',
  text: 'text-zinc-600',
  selected: '!bg-[#f1f5f9] !text-[#334155] !border-[#e2e8f0]',
};

/**
 * Get color for a given value from a color map
 */
export function getColor(
  value: string,
  colorMap: Record<string, ChipColor>
): ChipColor {
  return colorMap[value] || defaultColor;
}
