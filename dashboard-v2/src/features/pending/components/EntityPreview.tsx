import { useDashboardInit } from '@/queries/useDashboardInit';
import type { Track, Condition, Hypothesis, Project, Task } from '@/types';

interface EntityPreviewProps {
  entityId: string;
  entityType: 'Task' | 'Project' | 'Track' | 'Condition' | 'Hypothesis';
}

type EntityData = Track | Condition | Hypothesis | Project | Task | null;

const useEntityData = (
  entityId: string,
  entityType: 'Task' | 'Project' | 'Track' | 'Condition' | 'Hypothesis'
): { data: EntityData; isLoading: boolean; error: string | null } => {
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardInit();

  // Map entity type to internal type
  const type = entityType.toLowerCase() as 'track' | 'condition' | 'hypothesis' | 'project' | 'task';

  // Local lookup for Track, Condition, Hypothesis, Project
  if (isDashboardLoading) {
    return { data: null, isLoading: true, error: null };
  }

  if (!dashboardData) {
    return { data: null, isLoading: false, error: 'Dashboard data not available' };
  }

  if (type === 'track') {
    const track = dashboardData.tracks.find((t) => t.entity_id === entityId);
    return { data: track || null, isLoading: false, error: track ? null : 'Track not found' };
  }

  if (type === 'condition') {
    const condition = dashboardData.conditions.find((c) => c.entity_id === entityId);
    return { data: condition || null, isLoading: false, error: condition ? null : 'Condition not found' };
  }

  if (type === 'hypothesis') {
    const hypothesis = dashboardData.hypotheses.find((h) => h.entity_id === entityId);
    return { data: hypothesis || null, isLoading: false, error: hypothesis ? null : 'Hypothesis not found' };
  }

  if (type === 'project') {
    const project = dashboardData.projects.find((p) => p.entity_id === entityId);
    return { data: project || null, isLoading: false, error: project ? null : 'Project not found' };
  }

  if (type === 'task') {
    // Use useTask hook for API fetch (though tasks are also in dashboardData)
    // For consistency, we'll use local lookup from dashboardData
    const task = dashboardData.tasks.find((t) => t.entity_id === entityId);
    return { data: task || null, isLoading: false, error: task ? null : 'Task not found' };
  }

  return { data: null, isLoading: false, error: 'Unknown entity type' };
};

const EntityFieldDisplay = ({ label, value }: { label: string; value: unknown }) => {
  if (value === null || value === undefined) return null;

  // Array display
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return (
      <div className="mb-2">
        <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>
        <div className="flex flex-wrap gap-1">
          {value.map((item, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">
              {String(item)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Object display
  if (typeof value === 'object') {
    return (
      <div className="mb-2">
        <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto text-gray-700">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    );
  }

  // Primitive display
  return (
    <div className="mb-2">
      <div className="text-xs font-medium text-gray-700">{label}</div>
      <div className="text-sm text-gray-900">{String(value)}</div>
    </div>
  );
};

export const EntityPreview = ({ entityId, entityType }: EntityPreviewProps) => {
  const { data, isLoading, error } = useEntityData(entityId, entityType);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-500">Loading entity...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-500">Entity not found</div>
      </div>
    );
  }

  // Render entity fields
  const fieldsToDisplay = Object.entries(data).filter(
    ([key, value]) => !key.startsWith('_') && value !== null && value !== undefined && value !== ''
  );

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Entity Preview</h3>
      <div className="space-y-1">
        {fieldsToDisplay.map(([key, value]) => (
          <EntityFieldDisplay key={key} label={key} value={value} />
        ))}
      </div>
    </div>
  );
};
