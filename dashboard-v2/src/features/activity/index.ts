/**
 * Activity Feature - Public API
 *
 * Clean Architecture layers:
 * - Domain: Pure types and business logic
 * - Data: API infrastructure
 * - Application: Use cases (React Query hooks)
 * - Presentation: UI components
 *
 * Export only what's needed by external consumers
 */

// Re-export main component (NEW Clean Architecture version)
export { ActivityPanel } from './presentation/ActivityPanel';

// Keep legacy exports for compatibility (can be removed after migration)
export { ActivityToggle } from './components';

// Re-export types if needed by consumers
export type { EntityType, ActionType, AuditLogEntry } from './domain/types';
