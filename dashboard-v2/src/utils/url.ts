/**
 * URL utilities for Share URL generation (SSOT)
 * Handles production basename '/v2' and SSR safety
 */

export type EntityType = 'task' | 'project' | 'track' | 'hypothesis' | 'condition' | 'program';

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
 * @param entityType - Type of entity
 * @param entityId - Entity ID
 * @returns Full share URL
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

  // Entity types with dedicated routes
  if (entityType === 'task' || entityType === 'project') {
    return `${baseUrl}/${entityType}s/${entityId}`;
  }

  // Other entities open via drawer query param
  return `${baseUrl}/?drawer=${entityType}:${entityId}`;
}
