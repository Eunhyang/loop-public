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
    bg: 'bg-zinc-50',
    text: 'text-zinc-500',
    selected: '!bg-[#f8f8f8] !text-[#18181b] !border-[#e4e4e7]',
  },
  doing: {
    bg: 'bg-blue-50/50',
    text: 'text-blue-500',
    selected: '!bg-[#f0f9ff] !text-[#082f49] !border-[#bae6fd]',
  },
  done: {
    bg: 'bg-green-50/50',
    text: 'text-green-500',
    selected: '!bg-[#f0fdf4] !text-[#166534] !border-[#bbf7d0]',
  },
  hold: {
    bg: 'bg-amber-50/50',
    text: 'text-amber-500',
    selected: '!bg-[#fffbeb] !text-[#78350f] !border-[#fef3c7]',
  },
  blocked: {
    bg: 'bg-red-50/50',
    text: 'text-red-500',
    selected: '!bg-[#fef2f2] !text-[#991b1b] !border-[#fecaca]',
  },
};

/**
 * Priority colors (4 levels)
 */
export const priorityColors: Record<string, ChipColor> = {
  critical: {
    bg: 'bg-purple-50/50',
    text: 'text-purple-500',
    selected: '!bg-[#faf5ff] !text-[#581c87] !border-[#e9d5ff]',
  },
  high: {
    bg: 'bg-red-50/50',
    text: 'text-red-500',
    selected: '!bg-[#fef2f2] !text-[#991b1b] !border-[#fecaca]',
  },
  medium: {
    bg: 'bg-amber-50/50',
    text: 'text-amber-500',
    selected: '!bg-[#fffbeb] !text-[#78350f] !border-[#fef3c7]',
  },
  low: {
    bg: 'bg-zinc-50/50',
    text: 'text-zinc-500',
    selected: '!bg-[#f8f8f8] !text-[#18181b] !border-[#e4e4e7]',
  },
};

/**
 * Member colors (for assignee/owner chips)
 */
export const memberColor: ChipColor = {
  bg: 'bg-white',
  text: 'text-zinc-400',
  selected: '!bg-zinc-100 !text-zinc-900 !border-zinc-300',
};

/**
 * Project colors (for project selection chips)
 */
export const projectColor: ChipColor = {
  bg: 'bg-white',
  text: 'text-zinc-400',
  selected: '!bg-zinc-100 !text-zinc-900 !border-zinc-300',
};

/**
 * Unassigned state color (low emphasis)
 */
export const unassignedColor: ChipColor = {
  bg: 'bg-white',
  text: 'text-zinc-400',
  selected: '!bg-[#f4f4f5] !text-[#71717a] !border-[#e4e4e7]',
};

/**
 * Default fallback color for undefined values
 */
export const defaultColor: ChipColor = {
  bg: 'bg-white',
  text: 'text-zinc-600',
  selected: '!bg-[#f0f9ff] !text-[#082f49] !border-[#bae6fd]',
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
