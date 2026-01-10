import { useSyncExternalStore, useCallback } from 'react';
import {
  getSnapshot,
  getServerSnapshot,
  subscribe,
  toggleFavorite as storeToggleFavorite,
  pruneFavorites as storePruneFavorites,
} from '../store/favoritesStore';

export interface UseFavoritesReturn {
  favoriteIds: string[];
  toggleFavorite: (taskId: string) => boolean;
  isFavorited: (taskId: string) => boolean;
  pruneFavorites: (validTaskIds: Set<string>) => void;
}

export function useFavorites(): UseFavoritesReturn {
  const favoriteIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggleFavorite = useCallback((taskId: string) => storeToggleFavorite(taskId), []);
  const isFavorited = useCallback((taskId: string) => favoriteIds.includes(taskId), [favoriteIds]);
  const pruneFavorites = useCallback((validTaskIds: Set<string>) => storePruneFavorites(validTaskIds), []);
  return { favoriteIds, toggleFavorite, isFavorited, pruneFavorites };
}
