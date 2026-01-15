/**
 * Constants Type Definitions
 *
 * Type definitions for constants received from API SSOT (schema_constants.yaml)
 * These types mirror the structure of /api/dashboard-init constants field
 */

export interface TaskConstants {
  status: string[];
  status_default: string;
  status_labels: Record<string, string>;
  status_colors: Record<string, string>;
  types: string[];
  target_projects: string[];
}

export interface PriorityConstants {
  values: string[];
  default: string;
  labels: Record<string, string>;
  colors: Record<string, string>;
}

export interface ProjectConstants {
  status: string[];
  status_default: string;
  status_labels: Record<string, string>;
  status_colors: Record<string, string>;
}

export interface Constants {
  task: TaskConstants;
  priority: PriorityConstants;
  project: ProjectConstants;
  program_types?: string[];
  // Add other constant groups as needed (hypothesis, condition, etc.)
}
