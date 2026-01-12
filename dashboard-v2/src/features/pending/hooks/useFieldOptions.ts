import { useMemo } from 'react';
import { useDashboardInit } from '@/queries/useDashboardInit';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldOptions {
  assignee: FieldOption[];
  priority: FieldOption[];
  status: FieldOption[];
  type: FieldOption[];
  conditions_3y: FieldOption[];
}

export interface FieldConfig {
  multiSelect: boolean;
}

export const FIELD_CONFIG: Record<string, FieldConfig> = {
  assignee: { multiSelect: false },
  priority: { multiSelect: false },
  status: { multiSelect: false },
  type: { multiSelect: false },
  conditions_3y: { multiSelect: true },
} as const;

/**
 * Hook to extract field options from dashboard initialization data.
 * Reuses existing useDashboardInit query - no additional API calls.
 */
export function useFieldOptions(): FieldOptions | null {
  const { data: dashboardData } = useDashboardInit();

  return useMemo(() => {
    if (!dashboardData) return null;

    const constants = dashboardData.constants || {};

    return {
      assignee: (dashboardData.members || []).map(m => ({
        value: String(m.id), // Normalize to string
        label: m.name,
      })),
      priority: (constants.priority?.values || []).map((p: string) => ({
        value: String(p), // Ensure string
        label: p,
      })),
      status: (constants.task?.status || []).map((s: string) => ({
        value: String(s), // Ensure string
        label: s,
      })),
      type: (constants.task?.types || []).map((t: string) => ({
        value: String(t), // Ensure string
        label: t,
      })),
      conditions_3y: (dashboardData.conditions || []).map(c => ({
        value: String(c.entity_id), // Normalize to string (critical for numeric IDs)
        label: c.entity_name,
      })),
    };
  }, [dashboardData]);
}
