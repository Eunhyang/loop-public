import { useRef } from 'react';
import { useUi } from '@/contexts/UiContext';
import { DrawerShell } from '@/components/common/DrawerShell';
import { TaskForm, type TaskFormHandle } from '@/features/tasks/components/TaskForm';
import { useDeleteTask } from '@/features/tasks/queries';
import { ProjectForm } from '@/features/projects/components/ProjectForm';
import { useDeleteProject } from '@/features/projects/queries';
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
  const { activeEntityDrawer, closeEntityDrawer, isDrawerExpanded, toggleDrawerExpand } = useUi();
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: deleteProject } = useDeleteProject();
  const taskFormRef = useRef<TaskFormHandle>(null);

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

  // Handle delete action
  const handleDelete = () => {
    if (!id) return;
    if (type === 'task') {
      if (window.confirm(`Are you sure you want to delete task ${id}?`)) {
        deleteTask(id, {
          onSuccess: () => {
            closeEntityDrawer();
          }
        });
      }
    } else if (type === 'project') {
      if (window.confirm(`Are you sure you want to delete project ${id}?\nThis will also delete all associated tasks.`)) {
        deleteProject(id, {
          onSuccess: () => {
            closeEntityDrawer();
          }
        });
      }
    }
  };

  // Handle save action (for tasks with notes)
  const handleSave = () => {
    taskFormRef.current?.saveNotes();
    closeEntityDrawer();
  };

  // Render footer (task/project edit mode)
  const renderFooter = () => {
    if (mode !== 'edit') return undefined;
    if (type !== 'task' && type !== 'project') return undefined;

    const entityLabel = type === 'task' ? 'Task' : 'Project';

    return (
      <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors font-medium"
        >
          Delete {entityLabel}
        </button>
        <div className="flex gap-2">
          <button
            onClick={closeEntityDrawer}
            className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-gray-100 rounded transition-colors"
          >
            Close
          </button>
          {type === 'task' && (
            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs !bg-[#f0f9ff] hover:!bg-[#e0f2fe] !text-[#082f49] border border-[#bae6fd] rounded font-semibold transition-all"
            >
              Save
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render appropriate form based on entity type
  const renderForm = () => {
    switch (type) {
      case 'task':
        return <TaskForm ref={taskFormRef} mode={mode as 'create' | 'edit'} id={id} prefill={prefill} />;
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
      width={type === 'task' && isDrawerExpanded ? 'w-full' : 'w-[600px]'}
      isExpanded={isDrawerExpanded}
      onToggleExpand={type === 'task' ? toggleDrawerExpand : undefined}
      showExpandButton={type === 'task'}
      footer={renderFooter()}
    >
      {renderForm()}
    </DrawerShell>
  );
}
