import { useUi } from '@/contexts/UiContext';
import { DrawerShell } from '@/components/common/DrawerShell';
import { TaskForm } from '@/features/tasks/components/TaskForm';
import { useDeleteTask, useDuplicateTask } from '@/features/tasks/queries';
import { ProjectForm } from '@/features/projects/components/ProjectForm';
import { useDeleteProject } from '@/features/projects/queries';
import { ProgramForm } from '@/features/programs/components/ProgramForm';
import { useDeleteProgram } from '@/features/programs/queries';
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
  const { activeEntityDrawer, closeEntityDrawer, isDrawerExpanded, toggleDrawerExpand, canGoBack, popDrawer, canGoForward, goForward, openEntityDrawer } = useUi();
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: duplicateTask } = useDuplicateTask();
  const { mutate: deleteProject } = useDeleteProject();
  const { mutate: deleteProgram } = useDeleteProgram();

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
    } else if (type === 'program') {
      if (window.confirm(`Are you sure you want to delete program ${id}?\nThis cannot be undone.`)) {
        deleteProgram(id, {
          onSuccess: () => {
            closeEntityDrawer();
          },
          onError: (err: any) => {
            // Display specific error message (e.g., "Cannot delete: N projects linked")
            const errorMessage = err?.response?.data?.detail || err.message || 'Failed to delete program';
            alert(errorMessage);
          }
        });
      }
    }
  };

  // Handle duplicate action (Task only)
  const handleDuplicate = () => {
    if (!id || type !== 'task') return;
    duplicateTask(id, {
      onSuccess: (response) => {
        const newTaskId = response.data.new_task_id;
        // Open the duplicated task in edit mode
        openEntityDrawer({ type: 'task', mode: 'edit', id: newTaskId });
      }
    });
  };

  // Render footer (task/project/program edit mode)
  const renderFooter = () => {
    if (mode !== 'edit') return undefined;
    if (type !== 'task' && type !== 'project' && type !== 'program') return undefined;

    const entityLabel = type === 'task' ? 'Task' : type === 'project' ? 'Project' : 'Program';

    return (
      <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors font-medium"
          >
            Delete {entityLabel}
          </button>
          {type === 'task' && (
            <button
              onClick={handleDuplicate}
              className="px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors font-medium"
            >
              Duplicate
            </button>
          )}
        </div>
        <button
          onClick={closeEntityDrawer}
          className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-gray-100 rounded transition-colors"
        >
          Close
        </button>
      </div>
    );
  };

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
      width={type === 'task' && isDrawerExpanded ? 'w-full' : 'w-[600px]'}
      isExpanded={isDrawerExpanded}
      onToggleExpand={type === 'task' ? toggleDrawerExpand : undefined}
      showExpandButton={type === 'task'}
      onBack={popDrawer}
      showBackButton={canGoBack}
      onForward={goForward}
      showForwardButton={canGoForward}
      footer={renderFooter()}
      entityId={id}
      entityType={type as any}
    >
      {renderForm()}
    </DrawerShell>
  );
}
