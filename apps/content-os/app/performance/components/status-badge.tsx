"use client";

import { DiagnosisStatus } from "@/types/performance";
import { STATUS_BADGE_CONFIG } from "../data/dummy-performance";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatusBadgeProps {
  status: DiagnosisStatus;
  showDescription?: boolean;
  className?: string;
}

const colorClasses = {
  green:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  blue: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  yellow:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  orange:
    "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  red: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

export function StatusBadge({
  status,
  showDescription = false,
  className,
}: StatusBadgeProps) {
  const config = STATUS_BADGE_CONFIG[status];

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap cursor-help",
              colorClasses[config.color]
            )}
          >
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{config.description}</p>
        </TooltipContent>
      </Tooltip>
      {showDescription && (
        <span className="text-xs text-muted-foreground">
          {config.description}
        </span>
      )}
    </div>
  );
}
