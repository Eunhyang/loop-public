import type { Project } from '@/types';

// Ultra-light warm tones (기존 색상 계열 + 더 연하게 + 웜톤)
export const TRACK_COLORS = {
  'trk-1': { bg: '#FFF8F8', accent: '#FFCDCD', name: 'Light Red' },      // Red 계열
  'trk-2': { bg: '#F8F6FC', accent: '#D8D0E8', name: 'Light Indigo' },   // Indigo 계열
  'trk-3': { bg: '#F5FCFC', accent: '#C0E8E8', name: 'Light Cyan' },     // Cyan 계열
  'trk-4': { bg: '#F5FCF5', accent: '#C8E8C8', name: 'Light Green' },    // Green 계열
  'trk-5': { bg: '#FFFCF0', accent: '#FFE8A8', name: 'Light Amber' },    // Amber 계열
  'trk-6': { bg: '#FFF8F5', accent: '#FFD8C8', name: 'Light Orange' },   // Orange 계열
} as const;

export const DEFAULT_TRACK_COLOR = {
  bg: '#F8F8F8',
  accent: '#E0E0E0',
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
