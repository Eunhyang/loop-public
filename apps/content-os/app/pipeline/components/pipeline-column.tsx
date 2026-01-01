"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  PipelineTask,
  PipelineStatus,
  PIPELINE_STATUS_LABELS,
  PIPELINE_STATUS_COLORS,
} from "@/lib/types/task";
import { PipelineCard } from "./pipeline-card";

interface PipelineColumnProps {
  status: PipelineStatus;
  tasks: PipelineTask[];
  onCardClick: (task: PipelineTask) => void;
}

function PipelineColumnComponent({
  status,
  tasks,
  onCardClick,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  const taskIds = tasks.map((task) => task.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 min-w-72 shrink-0 rounded-lg ${PIPELINE_STATUS_COLORS[status]} ${
        isOver ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <h3 className="font-semibold text-sm">
          {PIPELINE_STATUS_LABELS[status]}
        </h3>
        <span className="bg-background/80 text-foreground text-xs font-medium px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Task List */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto">
          {tasks.length === 0 ? (
            // Empty column placeholder (Codex recommendation)
            <div className="h-24 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg">
              Drop tasks here
            </div>
          ) : (
            tasks.map((task) => (
              <PipelineCard
                key={task.id}
                task={task}
                onClick={() => onCardClick(task)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// Memoize for performance
export const PipelineColumn = React.memo(PipelineColumnComponent);
