import type { FavoritesStorage, EntityType } from '../types';
import { FAVORITES_STORAGE_KEY, FAVORITES_SCHEMA_VERSION, MAX_FAVORITES_PER_TYPE } from '../constants';

type Listener = () => void;
let state: FavoritesStorage = loadFromStorage();
let listeners: Set<Listener> = new Set();

const VALID_ENTITY_TYPES = new Set<string>(['task', 'project', 'program']);

function isValidEntityType(type: unknown): type is EntityType {
  return typeof type === 'string' && VALID_ENTITY_TYPES.has(type);
}

function migrateV1toV2(oldData: any): FavoritesStorage {
  // Handle malformed taskIds
  const taskIds = Array.isArray(oldData?.taskIds) ? oldData.taskIds : [];

  return {
    _schemaVersion: FAVORITES_SCHEMA_VERSION,
    entityIds: {
      task: taskIds, // Allow overflow - preserve all favorites
      project: [],
      program: []
    }
  };
}

function loadFromStorage(): FavoritesStorage {
  if (typeof window === 'undefined') {
    return { _schemaVersion: FAVORITES_SCHEMA_VERSION, entityIds: { task: [], project: [], program: [] } };
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      return { _schemaVersion: FAVORITES_SCHEMA_VERSION, entityIds: { task: [], project: [], program: [] } };
    }

    const parsed = JSON.parse(raw);

    // Handle v1 or unknown version
    if (!parsed._schemaVersion || parsed._schemaVersion < FAVORITES_SCHEMA_VERSION) {
      const migrated = migrateV1toV2(parsed);
      saveToStorage(migrated); // Save migrated version immediately
      return migrated;
    }

    // Handle malformed v2 data
    if (parsed._schemaVersion === FAVORITES_SCHEMA_VERSION) {
      const entityIds = parsed.entityIds || {};
      return {
        _schemaVersion: FAVORITES_SCHEMA_VERSION,
        entityIds: {
          task: Array.isArray(entityIds.task) ? entityIds.task : [],
          project: Array.isArray(entityIds.project) ? entityIds.project : [],
          program: Array.isArray(entityIds.program) ? entityIds.program : []
        }
      };
    }

    // Future version - return empty
    console.warn('[Favorites] Unknown schema version, resetting');
    return { _schemaVersion: FAVORITES_SCHEMA_VERSION, entityIds: { task: [], project: [], program: [] } };

  } catch (error) {
    console.warn('[Favorites] Failed to load, resetting:', error);
    return { _schemaVersion: FAVORITES_SCHEMA_VERSION, entityIds: { task: [], project: [], program: [] } };
  }
}

function saveToStorage(data: FavoritesStorage): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('[Favorites] Failed to save (quota?):', error);
  }
}

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

export function getSnapshot(entityType?: EntityType): string[] {
  if (!entityType) {
    // Backward compat: return task favorites when no type specified
    return state.entityIds.task;
  }

  // Runtime validation
  if (!isValidEntityType(entityType)) {
    console.warn(`[Favorites] Invalid entityType "${entityType}", returning empty array`);
    return [];
  }

  return state.entityIds[entityType];
}

// Composite snapshot for hook subscription (triggers on ANY favorite change)
export function getCompositeSnapshot(): FavoritesStorage {
  return state;
}

export function getServerSnapshot(): string[] {
  return [];
}

export function getCompositeServerSnapshot(): FavoritesStorage {
  return { _schemaVersion: FAVORITES_SCHEMA_VERSION, entityIds: { task: [], project: [], program: [] } };
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === FAVORITES_STORAGE_KEY) {
      state = loadFromStorage();
      emitChange();
    }
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', handleStorageEvent);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', handleStorageEvent);
  };
}

export function toggleFavorite(entityId: string, entityType: EntityType): boolean {
  // Runtime validation
  if (!isValidEntityType(entityType)) {
    console.error(`[Favorites] Invalid entityType "${entityType}"`);
    return false;
  }

  const currentIds = state.entityIds[entityType];
  const index = currentIds.indexOf(entityId);

  if (index >= 0) {
    // Remove
    state = {
      ...state,
      entityIds: {
        ...state.entityIds,
        [entityType]: currentIds.filter((id) => id !== entityId)
      }
    };
    saveToStorage(state);
    emitChange();
    return false;
  } else {
    // Add - check per-type limit
    if (currentIds.length >= MAX_FAVORITES_PER_TYPE) {
      console.warn(`[Favorites] Cannot add more than ${MAX_FAVORITES_PER_TYPE} ${entityType} favorites`);
      return false;
    }

    state = {
      ...state,
      entityIds: {
        ...state.entityIds,
        [entityType]: [...currentIds, entityId]
      }
    };
    saveToStorage(state);
    emitChange();
    return true;
  }
}

export function isFavorited(entityId: string, entityType: EntityType): boolean {
  if (!isValidEntityType(entityType)) return false;
  return state.entityIds[entityType].includes(entityId);
}

export function pruneFavorites(validIds: Set<string>, entityType: EntityType): void {
  if (!isValidEntityType(entityType)) return;

  const pruned = state.entityIds[entityType].filter((id) => validIds.has(id));
  if (pruned.length !== state.entityIds[entityType].length) {
    state = {
      ...state,
      entityIds: {
        ...state.entityIds,
        [entityType]: pruned
      }
    };
    saveToStorage(state);
    emitChange();
  }
}

export function resetFavorites(): void {
  state = { _schemaVersion: FAVORITES_SCHEMA_VERSION, entityIds: { task: [], project: [], program: [] } };
  if (typeof window !== 'undefined') {
    try { window.localStorage.removeItem(FAVORITES_STORAGE_KEY); }
    catch (error) { console.error('[Favorites] Failed to remove:', error); }
  }
  emitChange();
}
