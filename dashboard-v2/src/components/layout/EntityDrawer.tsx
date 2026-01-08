import { useUi } from '@/contexts/UiContext';
import { DrawerShell } from '@/components/common/DrawerShell';

/**
 * EntityDrawer - Universal entity drawer router
 *
 * Routes to appropriate Form component based on activeEntityDrawer state.
 * Replaces CreationDrawer with a unified approach for all entities.
 *
 * Supported entities:
 * - task, project, program (CRUD)
 * - track, condition (View-only)
 * - hypothesis (CRUD)
 */
export function EntityDrawer() {
  const { activeEntityDrawer, closeEntityDrawer } = useUi();

  if (!activeEntityDrawer) return null;

  const { type, mode } = activeEntityDrawer;
  const id = 'id' in activeEntityDrawer ? activeEntityDrawer.id : undefined;
  const prefill = 'prefill' in activeEntityDrawer ? activeEntityDrawer.prefill : undefined;

  // Generate title based on entity type and mode
  const getTitle = () => {
    const entityNames = {
      task: 'Task',
      project: 'Project',
      program: 'Program',
      track: 'Track',
      hypothesis: 'Hypothesis',
      condition: 'Condition'
    };

    const modeNames = {
      create: 'Create',
      edit: 'Edit',
      view: 'View'
    };

    return `${modeNames[mode]} ${entityNames[type]}`;
  };

  // Generate subtitle (entity ID for edit/view modes)
  const subtitle = mode !== 'create' && id ? id : undefined;

  return (
    <DrawerShell
      isOpen={true}
      onClose={closeEntityDrawer}
      title={getTitle()}
      subtitle={subtitle}
    >
      {/* TODO: Route to actual Form components */}
      {/* For now, render placeholder */}
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Entity Drawer Placeholder</strong>
          </p>
          <p className="text-xs text-yellow-700 mt-2">
            Entity Type: <code>{type}</code><br />
            Mode: <code>{mode}</code><br />
            ID: <code>{id || 'N/A'}</code><br />
            Prefill: <code>{prefill ? JSON.stringify(prefill) : 'N/A'}</code>
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Form components will be implemented in Phase 2.
        </p>
      </div>

      {/* Phase 2: Uncomment and implement */}
      {/*
      {type === 'task' && (
        <TaskForm mode={mode === 'view' ? 'edit' : mode} id={id} prefill={prefill} />
      )}
      {type === 'project' && (
        <ProjectForm mode={mode === 'view' ? 'edit' : mode} id={id} prefill={prefill} />
      )}
      {type === 'program' && (
        <ProgramForm mode={mode === 'view' ? 'edit' : mode} id={id} prefill={prefill} />
      )}
      {type === 'track' && id && (
        <TrackForm id={id} />
      )}
      {type === 'hypothesis' && (
        <HypothesisForm mode={mode === 'view' ? 'edit' : mode} id={id} prefill={prefill} />
      )}
      {type === 'condition' && id && (
        <ConditionForm id={id} />
      )}
      */}
    </DrawerShell>
  );
}
