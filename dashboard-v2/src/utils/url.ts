/**
 * URL utilities for Share URL generation (SSOT)
 * Handles production basename '/v2' and SSR safety
 */

export type EntityType = 'task' | 'project';

/**
 * Get the base URL for the application
 * In production: includes '/v2' basename
 * In development: no basename
 *
 * @returns Base URL with basename (e.g., 'http://localhost:5173' or 'https://domain.com/v2')
 */
export function getBaseUrl(): string {
  // SSR safety check
  if (typeof window === 'undefined') {
    return '';
  }

  const origin = window.location.origin;
  const basename = import.meta.env.PROD ? '/v2' : '';
  return `${origin}${basename}`;
}

/**
 * Generate a share URL for an entity
 *
 * @param entityType - Type of entity ('task' or 'project')
 * @param entityId - Entity ID (e.g., 'tsk-a7k9m2-1736412652123' or 'prj-b8x3n4-1736412652456')
 * @returns Full share URL (e.g., 'http://localhost:5173/tasks/tsk-a7k9m2-1736412652123')
 * @throws Error if entityId is empty
 */
export function generateShareUrl(
  entityType: EntityType,
  entityId: string
): string {
  // Input validation
  if (!entityId || entityId.trim().length === 0) {
    throw new Error('Entity ID cannot be empty');
  }

  const baseUrl = getBaseUrl();
  return `${baseUrl}/${entityType}s/${entityId}`;
}
