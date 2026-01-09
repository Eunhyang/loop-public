/**
 * Domain Layer - Types
 *
 * Pure type definitions for Activity feature
 * No external dependencies except TypeScript primitives
 */

// === Entity Types ===
export type EntityType = 'task' | 'project' | 'program' | 'track' | 'hypothesis' | 'condition';
export type ActionType = 'create' | 'update' | 'delete' | 'autofill';

// === Value Objects ===
export interface AuditLogEntry {
  timestamp: string;
  action: ActionType;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  user: string;
  details?: Record<string, any>;
}

export interface TimeGroup {
  label: string;        // "오늘", "어제", "이번 주", "1월 5일"
  items: AuditLogEntry[];
}

// === DTOs (Data Transfer Objects) ===
export interface GlobalAuditResponse {
  logs: AuditLogEntry[];
  total: number;
}
