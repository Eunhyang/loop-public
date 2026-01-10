/**
 * Favorites Store
 * 
 * External store for localStorage-based favorites state.
 * Uses React 18 useSyncExternalStore pattern for cross-component synchronization.
 */

import type { FavoritesStorage } from '../types';
import {
  FAVORITES_STORAGE_KEY,
  FAVORITES_SCHEMA_VERSION,
  MAX_FAVORITES,
} from '../constants';

type Listener = () => void;

let state: FavoritesStorage = loadFromStorage();
let listeners: Set<Listener> = new Set();

function loadFromStorage(): FavoritesStorage {
  if (typeof window === 'undefined') {
    return { _schemaVersion: FAVORITES_SCHEMA_VERSION, taskIds: [] };
  }
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return { _schemaVersion: FAVORITES_SCHEMA_VERSION, taskIds: [] };
    const parsed: FavoritesStorage = JSON.parse(raw);
    if (parsed._schemaVersion !== FAVORITES_SCHEMA_VERSION) {
      console.log('[Favorites Migration] Migrating from v', parsed._schemaVersion || 0, 'to v', FAVORITES_SCHEMA_VERSION);
      return { _schemaVersion: FAVORITES_SCHEMA_VERSION, taskIds: parsed.taskIds || [] };
    }
    return parsed;
  } catch (error) {
    console.warn('[Favorites] Failed to load favorites, resetting:', error);
    return { _schemaVersion: FAVORITES_SCHEMA_VERSION, taskIds: [] };
  }
}

function saveToStorage(data: FavoritesStorage): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('[Favorites] Failed to save favorites (quota/disabled?):', error);
  }
}

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

export function getSnapshot(): string[] {
  return state.taskIds;
}

export function getServerSnapshot(): string[] {
  return [];
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === FAVORITES_STORAGE_KEY) {
      state = loadFromStorage();
      emitChange();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}

export function toggleFavorite(taskId: string): boolean {
  const currentIds = state.taskIds;
  const index = currentIds.indexOf(taskId);
  if (index >= 0) {
    const newIds = currentIds.filter((id) => id !== taskId);
    state = { ...state, taskIds: newIds };
    saveToStorage(state);
    emitChange();
    return false;
  } else {
    if (currentIds.length >= MAX_FAVORITES) {
      console.warn(\`[Favorites] Cannot add more than \${MAX_FAVORITES} favorites\`);
      return false;
    }
    const newIds = [...currentIds.filter((id) => id !== taskId), taskId];
    state = { ...state, taskIds: newIds };
    saveToStorage(state);
    emitChange();
    return true;
  }
}

export function isFavorited(taskId: string): boolean {
  return state.taskIds.includes(taskId);
}

export function pruneFavorites(validTaskIds: Set<string>): void {
  const pruned = state.taskIds.filter((id) => validTaskIds.has(id));
  if (pruned.length !== state.taskIds.length) {
    console.log(\`[Favorites] Pruned \${state.taskIds.length - pruned.length} stale favorites\`);
    state = { ...state, taskIds: pruned };
    saveToStorage(state);
    emitChange();
  }
}

export function resetFavorites(): void {
  state = { _schemaVersion: FAVORITES_SCHEMA_VERSION, taskIds: [] };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
    } catch (error) {
      console.error('[Favorites] Failed to remove favorites from localStorage:', error);
    }
  }
  emitChange();
}
