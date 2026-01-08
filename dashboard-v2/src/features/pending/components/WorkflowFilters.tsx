import { useMemo } from 'react';
import type { PendingReview } from '../types';

interface WorkflowFiltersProps {
  reviews: PendingReview[];
  filterWorkflow: string;
  filterRunId: string;
  onWorkflowChange: (workflow: string) => void;
  onRunIdChange: (runId: string) => void;
  onDeleteFiltered: () => void;
  isDeleting: boolean;
}

export const WorkflowFilters = ({
  reviews,
  filterWorkflow,
  filterRunId,
  onWorkflowChange,
  onRunIdChange,
  onDeleteFiltered,
  isDeleting,
}: WorkflowFiltersProps) => {
  // Extract unique workflows and runIds (filter out null/undefined)
  const { workflows, runIds } = useMemo(() => {
    const workflowSet = new Set<string>();
    const runIdSet = new Set<string>();

    reviews.forEach((r) => {
      if (r.source_workflow) workflowSet.add(r.source_workflow);
      if (r.run_id) runIdSet.add(r.run_id);
    });

    return {
      workflows: Array.from(workflowSet).sort(),
      runIds: Array.from(runIdSet).sort(),
    };
  }, [reviews]);

  const hasFilter = filterWorkflow !== '' || filterRunId !== '';
  const canDelete = hasFilter && !isDeleting;

  return (
    <div className="flex gap-2 p-2 border-b bg-gray-50">
      {/* Workflow Filter */}
      <select
        value={filterWorkflow}
        onChange={(e) => onWorkflowChange(e.target.value)}
        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Filter by workflow"
      >
        <option value="">All Workflows</option>
        {workflows.map((workflow) => (
          <option key={workflow} value={workflow}>
            {workflow}
          </option>
        ))}
      </select>

      {/* Run ID Filter */}
      <select
        value={filterRunId}
        onChange={(e) => onRunIdChange(e.target.value)}
        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Filter by run ID"
      >
        <option value="">All Runs</option>
        {runIds.map((runId) => (
          <option key={runId} value={runId}>
            {runId.length > 40 ? runId.substring(0, 40) + '...' : runId}
          </option>
        ))}
      </select>

      {/* Delete Filtered Button */}
      <button
        onClick={onDeleteFiltered}
        disabled={!canDelete}
        className={`
          px-3 py-1 text-xs rounded font-medium transition-colors
          ${
            !canDelete
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
          }
        `}
        title={
          !hasFilter
            ? 'Select a filter first'
            : isDeleting
            ? 'Deleting...'
            : `Delete filtered reviews`
        }
      >
        {isDeleting ? 'Deleting...' : 'Delete Filtered'}
      </button>
    </div>
  );
};
