// Pipeline Task Types
import { PurposeType, TargetLoop, Format } from "./opportunity";

export type PipelineStatus =
  | "draft"
  | "approved"
  | "in_progress"
  | "published"
  | "reviewed";

export interface PipelineTask {
  id: string;
  title: string;
  format: Format;
  status: PipelineStatus;
  purposeType: PurposeType;
  targetLoop: TargetLoop;
  assignee: string;
  dueDate: string | null;
  score: number;
  referenceCount: number;
  createdAt: string;
}

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  in_progress: "In Progress",
  published: "Published",
  reviewed: "Reviewed",
};

export const PIPELINE_STATUS_ORDER: PipelineStatus[] = [
  "draft",
  "approved",
  "in_progress",
  "published",
  "reviewed",
];

export const PIPELINE_STATUS_COLORS: Record<PipelineStatus, string> = {
  draft: "bg-slate-100 dark:bg-slate-800",
  approved: "bg-blue-100 dark:bg-blue-900/30",
  in_progress: "bg-amber-100 dark:bg-amber-900/30",
  published: "bg-green-100 dark:bg-green-900/30",
  reviewed: "bg-purple-100 dark:bg-purple-900/30",
};

// Re-export opportunity types for convenience
export type { PurposeType, TargetLoop, Format };
export {
  PURPOSE_TYPE_LABELS,
  TARGET_LOOP_LABELS,
  FORMAT_LABELS,
} from "./opportunity";
