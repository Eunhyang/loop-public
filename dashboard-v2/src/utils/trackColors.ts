import type { Project } from '@/types';

export const TRACK_COLORS = {
  'trk-1': { bg: '#FFEBEE', accent: '#EF9A9A', name: 'Product' },
  'trk-2': { bg: '#E8EAF6', accent: '#9FA8DA', name: 'Vault' },
  'trk-3': { bg: '#E0F7FA', accent: '#80DEEA', name: 'Cyan' },
  'trk-4': { bg: '#E8F5E9', accent: '#A5D6A7', name: 'Green' },
  'trk-5': { bg: '#FFF8E1', accent: '#FFE082', name: 'Amber' },
  'trk-6': { bg: '#FBE9E7', accent: '#FFAB91', name: 'Orange' },
} as const;

export const DEFAULT_TRACK_COLOR = {
  bg: '#E0E0E0',
  accent: '#BDBDBD',
  name: 'Default'
};

export type TrackId = keyof typeof TRACK_COLORS;

/**
 * Get track color by track ID
 */
export function getTrackColor(trackId?: string | null) {
  if (!trackId) return DEFAULT_TRACK_COLOR;
  return TRACK_COLORS[trackId as TrackId] ?? DEFAULT_TRACK_COLOR;
}

/**
 * Get track color by project ID
 * Looks up the project's parent_id (track) and returns the corresponding color
 */
export function getTrackColorByProject(
  projectId: string | undefined | null,
  projects: Project[]
) {
  if (!projectId) return DEFAULT_TRACK_COLOR;
  const project = projects.find(p => p.entity_id === projectId);
  if (!project?.parent_id) return DEFAULT_TRACK_COLOR;
  return getTrackColor(project.parent_id);
}
