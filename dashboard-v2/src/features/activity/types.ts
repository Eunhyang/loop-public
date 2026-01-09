/**
 * Activity Panel Types
 *
 * Discriminated union for activity feed items (comments + history)
 * Normalized timestamp format (ISO 8601) for consistent sorting
 */

export type EntityType = 'task' | 'project' | 'program' | 'track' | 'hypothesis' | 'condition';

// Field diff payload for history items
export interface FieldDiff {
  field: string;
  oldValue: any;
  newValue: any;
  label: string;
}

// Base activity item shape
interface BaseActivityItem {
  id: string;
  timestamp: string; // ISO 8601 UTC
}

// Comment activity item
export interface CommentActivityItem extends BaseActivityItem {
  itemType: 'comment';
  entityType: EntityType;
  entityId: string;
  author: {
    name: string;
    email: string;
    icon?: string;
  };
  content: string;
  mentions: string[];
}

// History activity item
export interface HistoryActivityItem extends BaseActivityItem {
  itemType: 'history';
  entityType: string;
  entityId: string;
  entityName: string;
  actor: string;
  action: 'create' | 'update' | 'delete' | 'autofill';
  modifiedFields?: string[];
  diff?: Record<string, { old: any; new: any }>;
  details?: Record<string, any>;
}

// Discriminated union
export type ActivityFeedItem = CommentActivityItem | HistoryActivityItem;

// API response shapes
export interface EntityHistoryResponse {
  entity_id: string;
  history: HistoryEntry[];
  total_actions: number;
}

export interface HistoryEntry {
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  user: string;
  details?: Record<string, any>;
}

// Activity panel context state
export interface ActivityPanelState {
  isOpen: boolean;
  selectedEntity: {
    type: EntityType;
    id: string;
  } | null;
}
