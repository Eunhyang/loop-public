/**
 * Favorites Feature Types
 */

/**
 * Stored format in localStorage with schema version for migrations
 */
export interface FavoritesStorage {
  _schemaVersion: number;
  taskIds: string[]; // Ordered by addition time
}
