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
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    selected: 'bg-gray-200 border-gray-400',
  },
  doing: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    selected: 'bg-blue-200 border-blue-400',
  },
  done: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    selected: 'bg-green-200 border-green-400',
  },
  hold: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    selected: 'bg-yellow-200 border-yellow-400',
  },
  blocked: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    selected: 'bg-red-200 border-red-400',
  },
};

/**
 * Priority colors (4 levels)
 */
export const priorityColors: Record<string, ChipColor> = {
  critical: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    selected: 'bg-purple-200 border-purple-400',
  },
  high: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    selected: 'bg-red-200 border-red-400',
  },
  medium: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    selected: 'bg-yellow-200 border-yellow-400',
  },
  low: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    selected: 'bg-gray-200 border-gray-400',
  },
};

/**
 * Default fallback color for undefined values
 */
export const defaultColor: ChipColor = {
  bg: 'bg-gray-100',
  text: 'text-gray-700',
  selected: 'bg-gray-200 border-gray-400',
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
