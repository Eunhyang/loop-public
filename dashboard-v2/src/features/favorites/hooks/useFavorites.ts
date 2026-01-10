import { useSyncExternalStore, useCallback } from 'react';
import type { EntityType } from '../types';
import {
  getCompositeSnapshot,
  getCompositeServerSnapshot,
  subscribe,
  toggleFavorite as storeToggleFavorite,
  isFavorited as storeIsFavorited,
  pruneFavorites as storePruneFavorites,
} from '../store/favoritesStore';

export interface UseFavoritesReturn {
  favoriteIds: string[]; // Deprecated: maps to task favorites for backward compat
  getFavoriteIds: (entityType: EntityType) => string[];
  toggleFavorite: (entityId: string, entityType: EntityType) => boolean;
  isFavorited: (entityId: string, entityType: EntityType) => boolean;
  pruneFavorites: (validIds: Set<string>, entityType: EntityType) => void;
}

export function useFavorites(): UseFavoritesReturn {
  // Subscribe to composite snapshot (triggers on ANY favorite change, not just tasks)
  const compositeState = useSyncExternalStore(subscribe, getCompositeSnapshot, getCompositeServerSnapshot);

  // Extract task favorites for backward compat
  const favoriteIds = compositeState.entityIds.task;

  const getFavoriteIds = useCallback((entityType: EntityType) => compositeState.entityIds[entityType] || [], [compositeState]);
  const toggleFavorite = useCallback((entityId: string, entityType: EntityType) => storeToggleFavorite(entityId, entityType), []);
  const isFavorited = useCallback((entityId: string, entityType: EntityType) => storeIsFavorited(entityId, entityType), []);
  const pruneFavorites = useCallback((validIds: Set<string>, entityType: EntityType) => storePruneFavorites(validIds, entityType), []);

  return { favoriteIds, getFavoriteIds, toggleFavorite, isFavorited, pruneFavorites };
}
