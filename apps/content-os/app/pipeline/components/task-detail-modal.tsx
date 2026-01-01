"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PipelineTask,
  FORMAT_LABELS,
  PURPOSE_TYPE_LABELS,
  TARGET_LOOP_LABELS,
  PIPELINE_STATUS_LABELS,
} from "@/lib/types/task";
import {
  Calendar,
  User,
  FileText,
  Tag,
  Target,
  Clock,
  BarChart3,
} from "lucide-react";

interface TaskDetailModalProps {
  task: PipelineTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
}: TaskDetailModalProps) {
  if (!task) return null;

  const formatBadgeColor = {
    shorts: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    longform: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    community: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };

  const statusBadgeColor = {
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    published: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    reviewed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="secondary"
              className={formatBadgeColor[task.format]}
            >
              {FORMAT_LABELS[task.format]}
            </Badge>
            <Badge
              variant="secondary"
              className={statusBadgeColor[task.status]}
            >
              {PIPELINE_STATUS_LABELS[task.status]}
            </Badge>
          </div>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
          <DialogDescription>Task ID: {task.id}</DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-4">
          {/* Purpose & Target */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" />
                Purpose Type
              </div>
              <p className="font-medium text-sm">
                {PURPOSE_TYPE_LABELS[task.purposeType]}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                Target Loop
              </div>
              <p className="font-medium text-sm">
                {TARGET_LOOP_LABELS[task.targetLoop]}
              </p>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                Assignee
              </div>
              <p className="font-medium text-sm">{task.assignee}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Due Date
              </div>
              <p className="font-medium text-sm">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Not set"}
              </p>
            </div>
          </div>

          {/* Score & References */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <BarChart3 className="h-3 w-3" />
                Score
              </div>
              <p
                className={`font-bold text-lg ${
                  task.score >= 8.5
                    ? "text-green-600 dark:text-green-400"
                    : task.score >= 7
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-muted-foreground"
                }`}
              >
                {task.score.toFixed(1)}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                References
              </div>
              <p className="font-medium text-sm">
                {task.referenceCount} videos
              </p>
            </div>
          </div>

          {/* Created At */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Created
            </div>
            <p className="font-medium text-sm">
              {new Date(task.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
