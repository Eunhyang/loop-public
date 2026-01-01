"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PipelineTask,
  FORMAT_LABELS,
  PURPOSE_TYPE_LABELS,
  TARGET_LOOP_LABELS,
} from "@/lib/types/task";
import { Calendar, User, FileText, GripVertical } from "lucide-react";

interface PipelineCardProps {
  task: PipelineTask;
  onClick: () => void;
  isDragging?: boolean;
}

function PipelineCardComponent({ task, onClick, isDragging }: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatBadgeColor = {
    shorts: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    longform: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    community: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not dragging
    if (!isSortableDragging && !isDragging) {
      onClick();
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSortableDragging || isDragging
          ? "opacity-50 shadow-lg ring-2 ring-primary"
          : ""
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header: Format Badge + Drag Handle */}
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={formatBadgeColor[task.format]}
          >
            {FORMAT_LABELS[task.format]}
          </Badge>
          <button
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Title */}
        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>

        {/* Purpose & Target Loop */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {PURPOSE_TYPE_LABELS[task.purposeType]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {TARGET_LOOP_LABELS[task.targetLoop]}
          </Badge>
        </div>

        {/* Footer: Assignee, Due, Score, References */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.assignee}
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-medium ${
                task.score >= 8.5
                  ? "text-green-600 dark:text-green-400"
                  : task.score >= 7
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-muted-foreground"
              }`}
            >
              {task.score.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {task.referenceCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Memoize for performance (Codex recommendation)
export const PipelineCard = React.memo(PipelineCardComponent);
