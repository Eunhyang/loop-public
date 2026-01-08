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
    selected: 'bg-gray-300 border-gray-500',
  },
  doing: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    selected: 'bg-blue-300 border-blue-500',
  },
  done: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    selected: 'bg-green-300 border-green-500',
  },
  hold: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    selected: 'bg-yellow-300 border-yellow-500',
  },
  blocked: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    selected: 'bg-red-300 border-red-500',
  },
};

/**
 * Priority colors (4 levels)
 */
export const priorityColors: Record<string, ChipColor> = {
  critical: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    selected: 'bg-purple-300 border-purple-500',
  },
  high: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    selected: 'bg-red-300 border-red-500',
  },
  medium: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    selected: 'bg-yellow-300 border-yellow-500',
  },
  low: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    selected: 'bg-gray-300 border-gray-500',
  },
};

/**
 * Default fallback color for undefined values
 */
export const defaultColor: ChipColor = {
  bg: 'bg-gray-100',
  text: 'text-gray-700',
  selected: 'bg-gray-300 border-gray-500',
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
