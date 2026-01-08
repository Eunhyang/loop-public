import { useUi } from '@/contexts/UiContext';
import { DrawerShell } from '@/components/common/DrawerShell';
import { TaskForm } from '@/features/tasks/components/TaskForm';
import { ProjectForm } from '@/features/projects/components/ProjectForm';
import { ProgramForm } from '@/features/programs/components/ProgramForm';
import { TrackForm } from '@/features/strategy/components/TrackForm';
import { HypothesisForm } from '@/features/strategy/components/HypothesisForm';
import { ConditionForm } from '@/features/strategy/components/ConditionForm';

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

  // Render appropriate form based on entity type
  const renderForm = () => {
    switch (type) {
      case 'task':
        return <TaskForm mode={mode as 'create' | 'edit'} id={id} prefill={prefill} />;
      case 'project':
        return <ProjectForm mode={mode as 'create' | 'edit'} id={id} prefill={prefill} />;
      case 'program':
        return <ProgramForm mode={mode as 'create' | 'edit'} id={id} prefill={prefill} />;
      case 'track':
        return id ? <TrackForm id={id} /> : <div className="p-6 text-zinc-500">Track ID required</div>;
      case 'hypothesis':
        return <HypothesisForm mode={mode as 'create' | 'edit'} id={id} prefill={prefill} />;
      case 'condition':
        return id ? <ConditionForm id={id} /> : <div className="p-6 text-zinc-500">Condition ID required</div>;
      default:
        return <div className="p-6 text-zinc-500">Unknown entity type</div>;
    }
  };

  return (
    <DrawerShell
      isOpen={true}
      onClose={closeEntityDrawer}
      title={getTitle()}
      subtitle={subtitle}
    >
      {renderForm()}
    </DrawerShell>
  );
}
